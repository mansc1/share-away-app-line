

## Plan: ลบ active trip ของทั้ง 2 users เพื่อทดสอบ routing

### Step 1: ลบข้อมูลใน `user_active_trip`

Execute SQL via database tool:

```sql
DELETE FROM user_active_trip 
WHERE user_id IN ('aa154f14-e02a-4083-ab7b-dab1e581d89b', 'dfdcfb0e-f33d-4912-b8ea-4a757ba60004');
```

### Step 2: ทดสอบ

Login ผ่าน LINE → ระบบจะเรียก `get-active-trip` → ได้ `trip: null` → redirect ไป `/trip/new`

No code changes needed. Database operation only.

