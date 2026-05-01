# Smart Furniture Warehouse
ระบบร้านเฟอร์นิเจอร์นี้ถูกพัฒนาขึ้นเพื่อช่วยแก้ปัญหาที่มักเกิดขึ้นในการจัดการร้านค้า เช่น การตรวจสอบจำนวนสินค้าในคลังที่ไม่ถูกต้อง การติดตามคำสั่งซื้อที่ทำได้ยาก และการจัดเก็บข้อมูลลูกค้าที่ไม่เป็นระบบ ซึ่งปัญหาเหล่านี้อาจส่งผลต่อความถูกต้องของข้อมูลและประสิทธิภาพในการดำเนินงานของร้านค้า

ในส่วนของลูกค้า ระบบจะช่วยให้สามารถค้นหาและดูข้อมูลสินค้าภายในร้านได้ เช่น ชื่อสินค้า ประเภทสินค้า ราคา รายละเอียดสินค้า และจำนวนสินค้าที่มีอยู่ รวมถึงสามารถตรวจสอบสถานะคำสั่งซื้อของตนเองได้ผ่านระบบ ทำให้ลูกค้าสามารถติดตามความคืบหน้าของการสั่งซื้อได้อย่างสะดวก

---

## ภาพรวมระบบ
**เครื่องมือพัฒนา**
- `Backend` Django Framework (Python)
- `Frontend` HTML, CSS, JavaScript
- `Database` PostgreSQL
- `Version Control` Git

**ข้อกำหนดเบื้องต้น** ก่อนติดตั้งระบบ ผู้ใช้งานต้องติดตั้งเครื่องมือดังต่อไปนี้
- `Python`
- `pip (Python Package Manager)`
- `Github`
- `Database`

---

## ขั้นตอนการติดตั้งระบบ

**Clone โปรเจกต์จาก Git**
```bash
git clone https://github.com/FMaLife/Group10_CS251_Project.git
```

**สร้าง Virtual Environment**
```bash
#window
python -m venv venv

#Mac / Linux
source venv/bin/activate

```

**เปิดใช้งาน Virtual Environment**
```bash
venv\Scripts\activate
```


**ติดตั้ง Dependencies**
```bash
pip install -r requirements.txt
```

**ทำ Migration**
```bash
#สร้างไฟล์ Migration
python manage.py makemigrations

#อัปเดตฐานข้อมูล
python manage.py migrate
```

**รัน Server**
```bash
#เข้าโฟลเดอร์ backend
cd backend

#รัน server
python manage.py server
```

เปิด http://127.0.0.1:8000/ เพื่อดูผลลัพธ์
