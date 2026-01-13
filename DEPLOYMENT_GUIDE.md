# Deployment Guide - Softtech Agent API

## การ Deploy/Update Code ขึ้น VPS

### ข้อมูล VPS
- **IP:** 203.78.103.157
- **Port SSH:** 6789
- **User:** root
- **Path:** /opt/softtech-agent-api

---

## วิธีที่ 1: Build ในเครื่อง Local แล้ว Upload (แนะนำ)

ใช้วิธีนี้เมื่อ VPS มีปัญหา network หรือต้องการความเร็ว

### ขั้นตอน:

```bash
# 1. เข้า directory project
cd /Users/0xfff/Softtech-agent-api-1

# 2. Build image สำหรับ AMD64 (VPS)
docker build --platform linux/amd64 -t softtech-agent-api:latest .

# 3. Save image เป็นไฟล์
docker save softtech-agent-api:latest | gzip > softtech-agent-api.tar.gz

# 4. Upload ไฟล์ขึ้น VPS
scp -P 6789 softtech-agent-api.tar.gz root@203.78.103.157:/opt/softtech-agent-api/

# 5. SSH เข้า VPS แล้ว deploy
ssh -p 6789 root@203.78.103.157

# 6. บน VPS: Load image แล้วรัน
cd /opt/softtech-agent-api
docker-compose down
docker load < softtech-agent-api.tar.gz
docker-compose up -d

# 7. เช็ค logs
docker-compose logs -f
```



---


## คำสั่งที่ใช้บ่อย

### ดู Logs
```bash
# ดู logs แบบ real-time
docker-compose logs -f

# ดู logs 100 บรรทัดล่าสุด
docker-compose logs --tail 100
```

### Restart Container
```bash
docker-compose restart
```

### Stop Container
```bash
docker-compose down
```

### เช็ค Status
```bash
docker-compose ps
```

### เช็ค Health
```bash
curl http://localhost:3006/health
```

### เข้าไปใน Container
```bash
docker exec -it softtech-agent-api sh
```

### ดู Disk Usage
```bash
docker system df
```

### ล้าง Cache และ Images เก่า
```bash
docker system prune -af
```

---

## Troubleshooting

### ปัญหา: Container restart loop
```bash
# ดู logs หา error
docker-compose logs --tail 50

# เช็คว่า .env มีครบไหม
cat .env
```

### ปัญหา: Port ถูกใช้งานอยู่
```bash
# หา process ที่ใช้ port 3006
lsof -i :3006

# Kill process
kill -9 <PID>
```

### ปัญหา: npm install ไม่ได้ (network)
ใช้วิธีที่ 1 - Build ในเครื่อง Local แล้ว Upload

### ปัญหา: Image platform ไม่ตรง
```bash
# ต้อง build ด้วย --platform linux/amd64
docker build --platform linux/amd64 -t softtech-agent-api:latest .
```

---