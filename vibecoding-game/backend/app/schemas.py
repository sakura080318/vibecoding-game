import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,50}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^1\d{10}$")


class RegisterRequest(BaseModel):
    """注册请求：字段和注册页表单一一对应。"""

    username: str = Field(..., description="登录账号，3-50 位字母/数字/下划线")
    email: str = Field(..., description="邮箱")
    phone: str = Field(..., description="11 位手机号")
    password: str = Field(..., min_length=6, max_length=64, description="密码，6-64 位")
    name: str = Field("", max_length=50, description="显示名称，不填就用账号")

    @field_validator("username")
    @classmethod
    def check_username(cls, value: str) -> str:
        """去掉首尾空格后校验字符集，长度交给 Field 管。"""
        value = value.strip()
        if not USERNAME_RE.match(value):
            raise ValueError("账号只能包含字母、数字、下划线，长度 3-50 位")
        return value

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        """邮箱统一转小写，避免同一个人用大小写注册出两个账号。"""
        value = value.strip().lower()
        if not EMAIL_RE.match(value):
            raise ValueError("邮箱格式不正确")
        return value

    @field_validator("phone")
    @classmethod
    def check_phone(cls, value: str) -> str:
        """前端可能带空格或短横线，先清掉再校验 11 位号码。"""
        value = value.replace(" ", "").replace("-", "")
        if not PHONE_RE.match(value):
            raise ValueError("手机号格式不正确")
        return value


class LoginRequest(BaseModel):
    """登录请求。密码不在这里限制长度，错的密码由登录逻辑统一回答「账号或密码错误」。"""

    username: str = Field(..., max_length=50, description="登录账号")
    password: str = Field(..., max_length=64, description="密码")


class UserInfo(BaseModel):
    """返回给前端的用户信息。这里没有 password 字段，所以密码不可能被序列化出去。"""

    id: int
    username: str
    name: str
    role: str
    email: str | None = None
    phone: str | None = None
    avatar: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """登录成功后前端要存的两样东西：token 和用户信息。"""

    token: str
    user: UserInfo
