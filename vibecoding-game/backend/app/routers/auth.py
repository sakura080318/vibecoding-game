from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import ROLE_USER, User
from app.schemas import LoginRequest, LoginResponse, RegisterRequest, UserInfo
from app.security import create_token, hash_password, parse_token, verify_password

router = APIRouter(prefix="/api", tags=["认证"])


def get_current_user(
    authorization: str = Header(default="", description="格式：Bearer <token>"),
    db: Session = Depends(get_db),
) -> User:
    """从请求头里取出并校验 token；无效、过期、账号被禁用都直接报错。"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录或登录已过期")

    user_id = parse_token(authorization[len("Bearer ") :])
    if user_id is None:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="账号不存在")
    if user.status != 1:
        raise HTTPException(status_code=403, detail="该账号已被禁用")
    return user


@router.post("/register", response_model=UserInfo, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """注册账号：先查账号/邮箱/手机号是否重复，再写入哈希后的密码。"""
    existing = (
        db.query(User)
        .filter(
            or_(
                # 账号不区分大小写查重，和登录、和 MySQL 的唯一索引保持一致
                func.lower(User.username) == payload.username.lower(),
                User.email == payload.email,
                User.phone == payload.phone,
            )
        )
        .first()
    )

    if existing is not None:
        # 告诉前端具体是哪个字段冲突，注册页才能把错误挂到对应输入框下面
        if existing.username.lower() == payload.username.lower():
            field_name, message = "username", "该账号已被注册"
        elif existing.email == payload.email:
            field_name, message = "email", "该邮箱已被注册"
        else:
            field_name, message = "phone", "该手机号已被注册"
        raise HTTPException(status_code=409, detail={"field": field_name, "message": message})

    user = User(
        username=payload.username,
        password=hash_password(payload.password),
        name=payload.name or payload.username,
        role=ROLE_USER,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        # 两个请求同时注册同一个账号时，唯一索引会在 commit 这一下拦住后到的那个
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail={"field": "username", "message": "该账号已被注册"},
        )

    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """登录并签发 token。

    账号不存在和密码错误返回同一句提示，避免别人拿接口试探哪些账号注册过。
    """
    username = payload.username.strip().lower()
    user = db.query(User).filter(func.lower(User.username) == username).first()

    if user is None or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    if user.status != 1:
        raise HTTPException(status_code=403, detail="该账号已被禁用")

    return LoginResponse(token=create_token(user.id), user=UserInfo.model_validate(user))


@router.get("/me", response_model=UserInfo)
def read_me(user: User = Depends(get_current_user)):
    """前端刷新页面后用本地 token 换最新的用户信息，顺便确认登录态还有效。"""
    return user
