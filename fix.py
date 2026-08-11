content = open('api/auth_routes.py', 'r', encoding='utf-8').read()

old = '''def get_password_hash(password):
    return pwd_context.hash(password)'''

new = '''def get_password_hash(password):
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password too long")
    return pwd_context.hash(password)'''

content = content.replace(old, new)

old2 = '''    hashed_password = get_password_hash(req.password)
    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",'''

new2 = '''    if len(req.password.encode('utf-8')) > 72:
        conn.close()
        raise HTTPException(status_code=400, detail="Password must be 72 characters or less")
    hashed_password = get_password_hash(req.password)
    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",'''

content = content.replace(old2, new2)
open('api/auth_routes.py', 'w', encoding='utf-8').write(content)
print('Done')