from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

# 角色只有两种取值。前端 auth store 里用的也是 user / admin，
# 之前注释写成 student，联调时容易对不上，这里统一。
ROLE_USER = "user"
ROLE_ADMIN = "admin"


class User(Base):
    """用户表：登录凭证、联系方式和个人资料。"""

    __tablename__ = "users"
    __table_args__ = {"comment": "用户信息表"}

    # 账号、邮箱、手机号都要求唯一：注册时先查重，并发时靠唯一索引兜底
    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, comment="登录账号", nullable=False
    )
    # 存的是「算法$迭代次数$盐$哈希」，所以长度按哈希串给足，绝不存明文
    password: Mapped[str] = mapped_column(
        String(255), comment="密码（PBKDF2 加盐哈希）", nullable=False
    )
    # 注册页只有账号/邮箱/手机号/密码，这里给默认值，避免插入时缺字段报错
    name: Mapped[str] = mapped_column(
        String(50), default="", comment="显示名称，注册不填时用账号", nullable=False
    )
    role: Mapped[str] = mapped_column(
        String(20), default=ROLE_USER, comment="角色：user-普通用户，admin-管理员", nullable=False
    )
    email: Mapped[str | None] = mapped_column(String(100), unique=True, comment="邮箱")
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, comment="手机号")
    avatar: Mapped[str | None] = mapped_column(String(255), comment="头像地址")
    status: Mapped[int] = mapped_column(default=1, comment="状态：0-禁用，1-正常")
