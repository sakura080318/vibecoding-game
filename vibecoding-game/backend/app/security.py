import base64
import hashlib
import hmac
import secrets
import time

from app.config import settings

PASSWORD_ITERATIONS = 120_000
SALT_BYTES = 16

TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60


def hash_password(password: str) -> str:
    """生成 `pbkdf2_sha256$迭代次数$盐$哈希` 形式的字符串，盐每次都不同。"""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """按存储串里记录的盐和迭代次数重算，再用 compare_digest 做定长比较。"""
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest.hex(), digest_hex)


def _to_base64(raw: bytes) -> str:
    """去掉末尾的 = 填充，token 更短，也方便原样放进请求头。"""
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _from_base64(text: str) -> bytes:
    """补回 _to_base64 去掉的填充；字符串非法时抛 ValueError。"""
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def create_token(user_id: int) -> str:
    """签发 `base64(用户ID:过期时间).base64(签名)`。

    服务端不保存会话，重启后 token 依然有效；改 SECRET_KEY 就等于让全部 token 作废。
    """
    payload = f"{user_id}:{int(time.time()) + TOKEN_TTL_SECONDS}"
    payload_base64 = _to_base64(payload.encode("utf-8"))
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"), payload_base64.encode("ascii"), hashlib.sha256
    )
    return f"{payload_base64}.{_to_base64(signature.digest())}"


def parse_token(token: str) -> int | None:
    """校验 token 的签名和过期时间，通过就返回用户 ID，任何一步不对都返回 None。"""
    parts = token.split(".")
    if len(parts) != 2:
        return None
    payload_base64, signature_base64 = parts

    expected = hmac.new(
        settings.SECRET_KEY.encode("utf-8"), payload_base64.encode("ascii"), hashlib.sha256
    )
    if not hmac.compare_digest(signature_base64, _to_base64(expected.digest())):
        return None

    try:
        user_id_text, expires_text = _from_base64(payload_base64).decode("utf-8").split(":")
        user_id = int(user_id_text)
        expires_at = int(expires_text)
    except (ValueError, UnicodeDecodeError):
        return None

    if expires_at < int(time.time()):
        return None
    return user_id
