# Deployment & Troubleshooting Guide

## ปัญหาที่พบและวิธีแก้ไข

### ปัญหา 1: dotenv โหลด environment variables ได้ 0 ตัว

**อาการ:**
```
[dotenv@17.2.2] injecting env (0) from .env
```

**สาเหตุ:**
1. ไฟล์ `.env` มีช่องว่างรอบเครื่องหมาย `=`
2. ไฟล์ `.env` ไม่ได้ถูก copy เข้า Docker image
3. ไฟล์ `.env` ถูก exclude โดย `.dockerignore`

**วิธีแก้:**

#### 1.1 แก้ไขรูปแบบไฟล์ .env
ต้องไม่มีช่องว่างรอบเครื่องหมาย `=`

**ผิด:**
```env
DB_NAME_EN = STN_CRM_EN
DB_NAME_MM = STN_CRM_MM
```

**ถูก:**
```env
DB_NAME_EN=STN_CRM_EN
DB_NAME_MM=STN_CRM_MM
```

#### 1.2 แก้ไข .dockerignore
Comment หรือลบบรรทัด `.env` ออก

**แก้ไขไฟล์ `.dockerignore`:**
```diff
# Environment files
- .env
+ #.env
.env.local
.env.*.local
```

#### 1.3 แก้ไข Dockerfile
เพิ่มการ copy `.env` เข้า image

**แก้ไขไฟล์ `Dockerfile`:**
```dockerfile
# Copy application source code
COPY index.js ./
COPY db.js ./
COPY .env ./          # เพิ่มบรรทัดนี้
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
```

---

### ปัญหา 2: Database Connection Timeout (ETIMEDOUT)

**อาการ:**
```
connect ETIMEDOUT 203.78.103.157:5432
```

**สาเหตุ:**
Docker ใช้ bridge network mode ทำให้ไม่สามารถเชื่อมต่อกับ external database ได้

**วิธีแก้:**

#### 2.1 ใช้ host network mode

**แก้ไขไฟล์ `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: softtech-agent-api
    restart: unless-stopped
    network_mode: host    # เพิ่มบรรทัดนี้
    # ลบ ports ออก (ไม่จำเป็นเมื่อใช้ host mode)
    # ลบ networks ออก (ใช้ไม่ได้กับ host mode)
    env_file:
      - .env
    volumes:
      - uploads-data:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=3006
      - DB_HOST=${DB_HOST:-localhost}
      - DB_PORT=${DB_PORT:-5432}
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME_TH=${DB_NAME_TH}
      - DB_NAME_MM=${DB_NAME_MM}
      - DB_NAME_EN=${DB_NAME_EN}
      - JWT_SECRET=${JWT_SECRET}

volumes:
  uploads-data:
    driver: local
```

---

### ปัญหา 3: เข้าถึง API จากภายนอกไม่ได้

**อาการ:**
- ภายใน server เข้าได้: `curl http://localhost:3006/health` ✅
- ภายนอก server เข้าไม่ได้: `curl http://203.78.103.157:3006/health` ❌

**สาเหตุ:**
1. Application bind ที่ localhost (127.0.0.1) เท่านั้น
2. Firewall block port 3006

**วิธีแก้:**

#### 3.1 แก้ไข index.js ให้ bind ที่ 0.0.0.0

**แก้ไขไฟล์ `index.js`:**
```javascript
// ผิด - bind ที่ localhost เท่านั้น
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ถูก - bind ที่ทุก network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
```

#### 3.2 เปิด port 3006 ใน iptables

**บน server รันคำสั่ง:**
```bash
# เพิ่ม rule เปิด port 3006
iptables -I INPUT -p tcp --dport 3006 -j ACCEPT

# บันทึก rules (AlmaLinux/RHEL)
iptables-save > /etc/sysconfig/iptables

# หรือใช้ iptables-legacy (ถ้าจำเป็น)
iptables-legacy-save > /etc/sysconfig/iptables
```

**ตรวจสอบว่า rule มีอยู่:**
```bash
iptables -L INPUT -n -v | grep 3006
```

ควรเห็น:
```
ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0            tcp dpt:3006
```

---

## ขั้นตอนการ Deploy

### 1. เตรียมไฟล์

**ตรวจสอบไฟล์ .env:**
```bash
cat .env
```

**ตรวจสอบว่าไม่มีช่องว่างรอบ `=`:**
```bash
cat .env | grep " = "
```

ถ้าพบ ให้แก้ไข:
```bash
sed -i 's/ = /=/g' .env
```

### 2. Upload ไฟล์ขึ้น Server

```bash
  rsync -avz -e "ssh -p 6789" \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'uploads' \
  "/Users/w/Desktop/Softtech Application/project/api/softtechnw-agent-api/" \
  root@softtechnw.com:/opt/softtech-agent-api/
```

### 3. สร้างไฟล์ .env บน Server (ถ้าจำเป็น)

```bash
ssh -p 6789 root@softtechnw.com

cd /opt/softtech-agent-api

cat > .env << 'EOF'
DB_HOST=203.78.103.157
DB_USER=admin
DB_PASS=StrongPassword123
DB_PORT=5432

DB_NAME_EN=STN_CRM_EN
DB_NAME_MM=STN_CRM_MM
DB_NAME_TH=STN_CRM_TH
PORT=3006

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRES=1h
EOF
```

### 4. Build และรัน Docker

```bash
# ลบ container เก่า
docker-compose down

# Build แบบ no-cache
docker-compose build --no-cache

# รัน container
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### 5. ตรวจสอบ

**ตรวจสอบ environment variables:**
```bash
docker exec -it softtech-agent-api env | grep -E "DB_|PORT|JWT"
```

**ตรวจสอบ network binding:**
```bash
netstat -tlnp | grep 3006
```

ควรเห็น:
```
tcp        0      0 0.0.0.0:3006            0.0.0.0:*               LISTEN
```

**ทดสอบจากภายใน:**
```bash
curl http://localhost:3006/health
curl http://localhost:3006/app/get_agent_all
```

**ทดสอบจากภายนอก:**
```bash
curl http://203.78.103.157:3006/health
curl http://softtechnw.com:3006/health
```

---

## Checklist การ Deploy

- [ ] ไฟล์ `.env` ไม่มีช่องว่างรอบ `=`
- [ ] `.dockerignore` comment `.env` ออกแล้ว
- [ ] `Dockerfile` มี `COPY .env ./`
- [ ] `docker-compose.yml` ใช้ `network_mode: host`
- [ ] `index.js` bind ที่ `0.0.0.0`
- [ ] iptables เปิด port 3006
- [ ] ทดสอบจากภายในสำเร็จ
- [ ] ทดสอบจากภายนอกสำเร็จ

---

## คำสั่งที่มีประโยชน์

### ดู logs
```bash
docker-compose logs -f
docker-compose logs -f --tail=100
```

### Restart container
```bash
docker-compose restart
```

### Rebuild container
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### ตรวจสอบ container
```bash
docker-compose ps
docker exec -it softtech-agent-api sh
```

### ดู resource usage
```bash
docker stats softtech-agent-api
```

### ลบ unused images
```bash
docker system prune -a
```

---

## API Endpoints

### Health Check
```
GET http://203.78.103.157:3006/health
GET http://softtechnw.com:3006/health
```

### Agent APIs
```
GET  http://203.78.103.157:3006/app/get_agent_all
POST http://203.78.103.157:3006/app/get_agent
POST http://203.78.103.157:3006/app/get_agent_idcard
POST http://203.78.103.157:3006/app/create_agent
POST http://203.78.103.157:3006/app/update_newpassword
```

### Admin APIs
```
POST http://203.78.103.157:3006/admin/...
```

---

## Production Best Practices

### 1. Security
- เปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัย
- ใช้ HTTPS/SSL certificate
- ใช้ environment variables แทนการ hardcode

### 2. Performance
- ใช้ PM2 หรือ process manager
- เพิ่ม connection pooling
- เพิ่ม caching layer (Redis)

### 3. Monitoring
- ตั้ง log aggregation
- ใช้ monitoring tools (Prometheus, Grafana)
- ตั้ง alerts สำหรับ errors

### 4. Backup
- สำรอง database เป็นประจำ
- สำรอง uploads directory
- เก็บ backup นอก server
