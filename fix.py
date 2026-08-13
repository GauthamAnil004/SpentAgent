content = open('api/auth_routes.py', 'r', encoding='utf-8').read()

old = '''def get_password_hash(password: str) -> str:
    password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)'''

new = '''def get_password_hash(password: str) -> str:
    import hashlib
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    import hashlib
    password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)'''

content = content.replace(old, new)
open('api/auth_routes.py', 'w', encoding='utf-8').write(content)
print('Done')