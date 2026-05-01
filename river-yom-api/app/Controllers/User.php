<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Models\UserTempModel;
use CodeIgniter\API\ResponseTrait;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class User extends BaseController
{
    use ResponseTrait;

    private $key;

    public function __construct()
    {
        // $this->key = getenv('JWT_SECRET'); // ตั้งค่าใน .env
        $this->key = env('JWT_SECRET');
    }

    public function verifyToken()
    {
        $jwt = $this->request->getCookie('jwt_token');
        if (!$jwt) {
            return false;
        }

        try {
            $decoded = JWT::decode($jwt, new Key(getenv('JWT_SECRET_KEY'), 'HS256'));
            return $decoded; // หรือ user id, username จาก payload
        } catch (\Exception $e) {
            return false;
        }
    }

    public function login()
    {   
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if (!$this->key) {
            return $this->failServerError('JWT secret key ไม่ถูกตั้งค่า');
        }

        $username = $this->request->getPost('username');
        $password = $this->request->getPost('password');

        $model = new UserModel();
        $user = $model->where('Username', $username)->first();

        if (!$user) {
            return $this->failNotFound('ไม่พบชื่อผู้ใช้');
        }

        if (!password_verify($password, $user['Password'])) {
            return $this->failUnauthorized('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }

        $payload = [
            'iss' => 'https://swocthachin.rid.go.th/swoc-api/',
            'aud' => 'https://swocthachin.rid.go.th/swoc-api/',
            'iat' => time(),
            'exp' => time() + 7200,
            'uid' => $user['User_ID'],
            'username' => $user['Username'],
            'iduser_level' => $user['iduser_level'],
            'email' => $user['email'],
            'name' => $user['Name'],
        ];

        $token = JWT::encode($payload, $this->key, 'HS256');

        setcookie(
            'access_token',
            $token,
            [
                'expires' => time() + 7200,
                'path' => '/',
                'domain' => '', // ใส่โดเมนหากมี
                // 'secure'    => $_SERVER['HTTPS'] === 'on' || $_SERVER['SERVER_PORT'] === '443',
                'secure' => false, // ✅ true ใน production (https เท่านั้น)
                'httponly' => true,
                'samesite' => 'Strict', // หรือ 'Strict'
            ]
        );

        return $this->respond([
            'message' => 'เข้าสู่ระบบสำเร็จ',
        ]);
    }

    public function logout()
    {
        setcookie('access_token', '', [
            'expires' => time() - 7200,
            'path' => '/',
            'domain' => '',
            'secure' => false,
            // 'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        return $this->respond(['message' => 'ออกจากระบบแล้ว']);
    }

    public function register()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $username = $this->request->getPost('username');
        $name = $this->request->getPost('name');
        $email = $this->request->getPost('email');
        $password = $this->request->getPost('password');

        if (!$username || !$email || !$password || !$name) {
            return $this->failValidationErrors('กรุณากรอกข้อมูลให้ครบ');
        }

        $tempModel = new UserTempModel();
        $userModel = new UserModel();

        // ตรวจซ้ำใน user หรือ user_temp
        if ($userModel->where('Username', $username)->first() || $tempModel->where('Username', $username)->first()) {
            return $this->fail('ชื่อผู้ใช้นี้มีในระบบแล้ว', 400);
        }
        if ($userModel->where('email', $email)->first() || $tempModel->where('email', $email)->first()) {
            return $this->fail('อีเมลนี้มีในระบบแล้ว', 400);
        }

        // --- เพิ่ม Logic สำหรับ Email Verification ---

        // 1. Generate a unique verification token
        $verificationToken = bin2hex(random_bytes(32)); // Creates a 64-character hex string
        $tokenExpiresAt = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token valid for 1 hour

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $data = [
            'Username' => $username,
            'email' => $email,
            'Password' => $hashedPassword,
            'Name' => $name,
            'CreateDate' => date('Y-m-d H:i:s'),
            'Status' => 0,  // ยังไม่ active
            'iduser_level' => 1,
            'verification_token' => $verificationToken, // Save the token
            'token_expires_at' => $tokenExpiresAt,     // Save token expiry
        ];

        try {
            $tempModel->insert($data); // บันทึกใน user_temp
        } catch (\Exception $e) {
            log_message('error', 'Failed to insert user into temp table: ' . $e->getMessage());
            return $this->fail('ไม่สามารถบันทึกข้อมูลได้', 500);
        }


        // 2. Send verification email
        $emailService = service('email');

        $emailService->setTo($email);
        $emailService->setSubject('ยืนยันการสมัครสมาชิก SWOC ท่าจีน'); // เปลี่ยนเป็นชื่อแอปของคุณ

        $frontendBaseUrl = 'https://swocthachin.rid.go.th'; // <-- แก้ไขตรงนี้ให้เป็น URL ของ Frontend คุณ

        $verificationLink = $frontendBaseUrl . '/verify-email?token=' . $verificationToken;

        // Important: If your frontend is on a different domain/port, replace base_url() with your frontend URL
        // Example: $verificationLink = 'http://localhost:3000/verify-email?token=' . $verificationToken;

        $message = "
            <html>
            <head>
                <title>ยืนยันการสมัครสมาชิก</title>
            </head>
            <body>
                <p>เรียนคุณ $name,</p>
                <p>ขอบคุณสำหรับการสมัครสมาชิกกับ SWOC ท่าจีน.</p>
                <p>กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันบัญชีของคุณ:</p>
                <p><a href=\"{$verificationLink}\">ยืนยันบัญชีของฉัน</a></p>
                <p>หากคุณไม่ได้สมัครสมาชิก กรุณาละเว้นอีเมลนี้.</p>
                <p>ขอแสดงความนับถือ,</p>
                <p>ทีมงาน SWOC ท่าจีน</p>
            </body>
            </html>
        ";

        $emailService->setMessage($message);

        if ($emailService->send()) {
            return $this->respondCreated([
                'message' => 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี.',
                'user' => [
                    'username' => $username,
                    'email' => $email,
                    'name' => $name,
                ]
            ]);
        } else {
            // If email fails to send, consider deleting the user from temp_users
            // Or log the error and let the user retry / contact support
            log_message('error', 'Failed to send verification email to ' . $email . ': ' . $emailService->printDebugger(['headers']));
            // Optionally, you might want to remove the user from user_temp if email sending is critical
            // $tempModel->delete($tempModel->getInsertID());
            return $this->fail('สมัครสมาชิกสำเร็จ แต่ไม่สามารถส่งอีเมลยืนยันได้ กรุณาติดต่อผู้ดูแลระบบ.', 500);
        }
    }

    // --- เพิ่ม Method สำหรับ Email Verification ---
    // app/Controllers/Auth.php
// app/Controllers/Auth.php

    public function verifyEmail()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $token = $this->request->getGet('token');

        if (!$token) {
            return $this->fail('ลิงก์ยืนยันไม่สมบูรณ์ หรือไม่มี Token', 400);
        }

        $tempModel = new \App\Models\UserTempModel();

        // 1. ลองค้นหาผู้ใช้ด้วย Token นี้ก่อน
        $user = $tempModel->where('verification_token', $token)->first();

        // --- ส่วนที่ต้องแก้ไข/เพิ่ม Logic ---
        if (!$user) {
            // ถ้าไม่พบผู้ใช้ด้วย Token นี้ (อาจจะถูกใช้ไปแล้ว หรือไม่เคยมีอยู่จริง)
            // ให้ลองค้นหาผู้ใช้จาก 'email' หรือ 'username' แทน
            // เพื่อตรวจสอบว่าผู้ใช้นี้ได้ทำการยืนยันอีเมลไปแล้วหรือไม่

            // **สำคัญ:** หากคุณไม่มี 'email' หรือ 'username' ใน Query String
            // คุณอาจจะต้องเก็บ email/username ใน session ตอนลงทะเบียน
            // หรือให้ Frontend ส่ง email/username มาพร้อมกับ Token ใน request
            // ในกรณีนี้ เราจะสมมติว่าคุณส่ง email มาด้วยใน Query String หรือ UserTempModel มีวิธีหา email จาก Token ได้ (ซึ่งตรงนี้ไม่มี)
            // หรือวิธีที่ง่ายที่สุดคือลองหาจาก Email ที่น่าจะอยู่ในระบบแล้ว

            // วิธีการหาผู้ใช้ที่ยืนยันแล้ว (Status = 1) แม้ Token จะเป็น NULL ไปแล้ว:
            // เนื่องจาก `token` ไม่ได้ผูกกับ user_temp ที่ `Status` เป็น 1 (เพราะ `verification_token` กลายเป็น `NULL`)
            // เราต้องหาทางระบุตัวผู้ใช้ที่กำลังพยายามยืนยัน
            // **วิธีที่ง่ายที่สุดคือให้ Frontend ส่ง `email` ของผู้ใช้มาด้วยใน Query String ตอนที่เรียก `verify-email`**
            // สมมติว่า URL ที่ Frontend เรียกคือ:
            // `http://localhost:8080/verify-email?token=...&email=user@example.com`
            $email_from_query = $this->request->getGet('email'); // ต้องเพิ่ม 'email' ในลิงก์ Frontend

            $user_by_email = null;
            if ($email_from_query) {
                $user_by_email = $tempModel->where('email', $email_from_query)->first();
            }

            if ($user_by_email && $user_by_email['Status'] == 1 && $user_by_email['verification_token'] === null) {
                // **สถานการณ์: ผู้ใช้นี้เคยยืนยันอีเมลสำเร็จไปแล้ว และ Token ถูกลบไปแล้ว**
                // คืนค่าสำเร็จ เพื่อให้ Frontend ไม่เห็น 404 ในการเรียกซ้ำ
                return $this->respond([
                    'message' => 'ลงทะเบียนสำเร็จแล้ว กรุณารอผู้ดูแลยืนยันบัญชี',
                    'username' => $user_by_email['Username']
                ], 200);
            } else {
                // **สถานการณ์: ไม่พบ Token และผู้ใช้ไม่ได้อยู่ในสถานะยืนยันแล้ว**
                // แสดงว่า Token ไม่ถูกต้องตั้งแต่แรก หรือผู้ใช้ถูกลบไปแล้ว
                return $this->fail('Token ไม่ถูกต้องหรือไม่พบผู้ใช้งาน', 404);
            }
        }
        // --- สิ้นสุดส่วนที่แก้ไข/เพิ่ม Logic ---

        // --- สถานการณ์ที่ 2: พบ Token, ตรวจสอบการหมดอายุ ---
        if (strtotime($user['token_expires_at']) < time()) {
            return $this->fail('ลิงก์ยืนยันหมดอายุแล้ว กรุณาสมัครใหม่', 400);
        }

        // --- สถานการณ์ที่ 3: พบ Token และยังไม่หมดอายุ, ตรวจสอบว่ายืนยันไปแล้วหรือยัง (Status = 1) ---
        // (ส่วนนี้จะถูกเรียกเมื่อ Token ยังมีอยู่และ Status เป็น 1 ซึ่งไม่ควรเกิดขึ้นถ้า Token ถูกลบเมื่อ Status = 1)
        // แต่ถ้ามีกรณีที่ Token ไม่ได้ถูกลบเมื่อ Status = 1 ตรงนี้จะทำงาน
        if ($user['Status'] == 1) {
            return $this->respond([
                'message' => 'ลงทะเบียนสำเร็จแล้ว กรุณารอผู้ดูแลยืนยันบัญชี',
                'username' => $user['Username']
            ], 200);
        }

        // --- สถานการณ์ที่ 4: พบ Token, ยังไม่หมดอายุ, และยังไม่ได้รับการยืนยัน (Status = 0) ---
        // ดำเนินการยืนยันอีเมลจริง (ครั้งแรกที่ถูกต้อง)
        $updateData = [
            'Status' => 1,
            // 'verification_token' => null, // **สำคัญ: ตรงนี้คือที่ Token ถูกเซ็ตเป็น NULL**
            // 'token_expires_at' => null,
        ];

        try {
            $tempModel->update($user[$tempModel->primaryKey], $updateData);
        } catch (\Exception $e) {
            log_message('error', 'Failed to update user status in temp table: ' . $e->getMessage());
            return $this->fail('ไม่สามารถอัปเดตสถานะผู้ใช้งานได้', 500);
        }

        // ตอบกลับความสำเร็จหลังการยืนยันครั้งแรก
        return $this->respond([
            'message' => 'ยืนยันอีเมลสำเร็จ! บัญชีของคุณรอการอนุมัติจากผู้ดูแลระบบ.',
            'username' => $user['Username']
        ], 200);
    }

    public function forgotPassword()
    {
        $email = $this->request->getPost('email');
        if (!$email) {
            return $this->failValidationErrors('กรุณากรอกอีเมล');
        }

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('ไม่พบอีเมลนี้ในระบบ');
        }

        // สร้าง Token และวันหมดอายุ
        $resetToken = bin2hex(random_bytes(32));
        $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // บันทึก token ลงฐานข้อมูล (เพิ่มฟิลด์ใหม่ในตาราง user)
        $userModel->update($user['User_ID'], [
            'reset_token' => $resetToken,
            'reset_expires_at' => $tokenExpires
        ]);

        // ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
        $emailService = service('email');
        $emailService->setTo($email);
        $emailService->setSubject('รีเซ็ตรหัสผ่าน SWOC ท่าจีน');

        $frontendBaseUrl = 'https://swocthachin.rid.go.th';
        $resetLink = $frontendBaseUrl . '/reset-password?token=' . $resetToken;

        $message = "
            <p>เรียนคุณ {$user['Name']},</p>
            <p>มีการร้องขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ.</p>
            <p>กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์จะหมดอายุภายใน 1 ชั่วโมง):</p>
            <p><a href='{$resetLink}'>รีเซ็ตรหัสผ่านของฉัน</a></p>
            <p>หากคุณไม่ได้ร้องขอ โปรดละเว้นอีเมลนี้.</p>
        ";

        $emailService->setMessage($message);

        if ($emailService->send()) {
            return $this->respond(['message' => 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว']);
        } else {
            log_message('error', 'Failed to send reset password email: ' . $emailService->printDebugger(['headers']));
            return $this->fail('ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่ภายหลัง');
        }
    }

    public function resetPassword()
    {
        $token = $this->request->getPost('token');
        $newPassword = $this->request->getPost('password');

        if (!$token || !$newPassword) {
            return $this->failValidationErrors('กรุณากรอกข้อมูลให้ครบ');
        }

        $userModel = new UserModel();
        $user = $userModel->where('reset_token', $token)->first();

        if (!$user) {
            return $this->failNotFound('Token ไม่ถูกต้อง');
        }

        if (strtotime($user['reset_expires_at']) < time()) {
            return $this->fail('ลิงก์นี้หมดอายุแล้ว กรุณาขอใหม่');
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        // อัปเดตรหัสผ่านและเคลียร์ token
        $userModel->update($user['User_ID'], [
            'Password' => $hashedPassword,
            'reset_token' => null,
            'reset_expires_at' => null
        ]);

        return $this->respond(['message' => 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว']);
    }

    public function validateResetToken()
    {
        $token = $this->request->getPost('token');
        if (!$token) {
            return $this->failValidationErrors('กรุณาส่ง Token');
        }

        $userModel = new UserModel();
        $user = $userModel->where('reset_token', $token)->first();

        if (!$user) {
            return $this->respond(['valid' => false, 'message' => 'Token ไม่ถูกต้อง']);
        }

        if (strtotime($user['reset_expires_at']) < time()) {
            return $this->respond(['valid' => false, 'message' => 'Token หมดอายุ']);
        }

        return $this->respond(['valid' => true]);
    }
    public function getUserByUsername($username)
    {
        if ($this->request->getMethod() === 'options') {
            return $this->response->setStatusCode(200)->send();
        }
    
        $token = $this->request->getCookie('access_token'); // อ่าน token จาก cookie
    
        if (!$token) {
            return $this->failUnauthorized('Missing access_token cookie');
        }
    
        try {
            // ตรวจสอบและถอดรหัส JWT
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));
            // คุณอาจตรวจสอบข้อมูลใน token เช่น username, roles, etc. ที่นี่
        } catch (\Exception $e) {
            return $this->failUnauthorized('Token ไม่ถูกต้อง: ' . $e->getMessage());
        }

        // ดึงข้อมูลผู้ใช้ตาม username
        $model = new UserModel();
        $user = $model->where('Username', $username)->first();

        if (!$user) {
            return $this->failNotFound('ไม่พบผู้ใช้');
        }

        return $this->respond($user);
    }


    
    public function getAllUsers()
    {
        if ($this->request->getMethod() === 'options') {
            return $this->response->setStatusCode(200)->send();
        }

        $token = $this->request->getCookie('access_token');

        if (!$token) {
            return $this->failUnauthorized('Missing access_token');
        }

        if (empty($this->key) || $this->key === 'fallback_secret_key') {
            return $this->fail('JWT secret key is missing or invalid');
        }
        
        try {
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));
        } catch (\Exception $e) {
            return $this->failUnauthorized('Invalid token: ' . $e->getMessage());
        }

        $model = new UserModel();
        $users = $model->findAll();

        return $this->respond($users);
    }

    public function updateUser($username = null)
    {
    
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        if (!$this->key) {
            return $this->failServerError('JWT secret key ไม่ถูกตั้งค่า');
        }

        $token = $this->request->getCookie('access_token'); // ✅ อ่านจาก cookie
        try {
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));
        } catch (\Exception $e) {
            return $this->failUnauthorized('Token ไม่ถูกต้อง: ' . $e->getMessage());
        }

        $model = new UserModel();

        // หา user โดย Username
        $user = $model->where('Username', $username)->first();
        if (!$user) {
            return $this->failNotFound('ไม่พบผู้ใช้งาน');
        }
        $input = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!is_array($input)) {
            return $this->failValidationErrors('ข้อมูลที่ส่งมาไม่ถูกต้อง');
        }

        // ตรวจสอบ $input ว่าเป็น array หรือไม่
        if (!is_array($input)) {
            return $this->failValidationErrors('ข้อมูลที่ส่งมาไม่ถูกต้อง');
        }

        // เตรียมข้อมูลที่จะอัปเดต
        $data = [];
        if (isset($input['Username'])) $data['Username'] = $input['Username'];
        if (isset($input['email'])) $data['email'] = $input['email'];
        if (isset($input['Name'])) $data['Name'] = $input['Name'];
        // if (isset($input['Status'])) $data['Status'] = $input['Status'];
        // if (isset($input['iduser_level'])) $data['iduser_level'] = $input['iduser_level'];
        if (isset($input['Password']) && !empty($input['Password'])) {
            $data['Password'] = password_hash($input['Password'], PASSWORD_DEFAULT);
        }

        if (empty($data)) {
            return $this->failValidationErrors('ไม่มีข้อมูลที่จะอัปเดต');
        }

        $model->update($user['User_ID'], $data);

        // ดึงข้อมูลผู้ใช้ที่อัปเดตแล้วมาแสดง
        $updatedUser = $model->find($user['User_ID']);
        unset($updatedUser['Password']); 
        return $this->respond([
            'message' => 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
            'user' => $updatedUser
        ]);
    }

    public function updateUserById($id)
    {
        if ($this->request->getMethod() === 'options') {
            return $this->response->setStatusCode(200)->send();
        }
        
        $token = $this->request->getCookie('access_token');
        if (!$token) {
            return $this->failUnauthorized('Missing access_token');
        }

        try {
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));
        } catch (\Exception $e) {
            return $this->failUnauthorized('Invalid token: ' . $e->getMessage());
        }

        $requesterLevel = (int) ($decoded->iduser_level ?? 0);
        $requesterId = (int) ($decoded->uid ?? 0); // uid = User_ID จาก token

        // อนุญาตเฉพาะ admin (level 2) หรือสูงกว่าเท่านั้นที่เรียก method นี้ได้
        if ($requesterLevel < 2) {
            return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้คนอื่น');
        }

        $model = new UserModel();
        $targetUser = $model->find($id);
        if (!$targetUser) {
            return $this->failNotFound('ไม่พบผู้ใช้งาน');
        }

        $targetLevel = (int) ($targetUser['iduser_level'] ?? 0);

        // กฎสิทธิ์: Admin (2) แก้ไข Operator (1) ได้เท่านั้น
        // ห้ามแก้ admin อื่น (level 2) ยกเว้นตัวเอง
        if ($requesterId === $targetUser['User_ID']) {
            // อนุญาตให้ admin แก้ไขตัวเองผ่าน method นี้ได้ (ถ้าต้องการ)
        } 
        elseif ($requesterLevel === 2 && $targetLevel !== 1) {
            return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้ดูแลระบบอื่น');
        } 
        elseif ($requesterLevel === 2 && $targetLevel === 1) {
            // Admin แก้ Operator ได้ → ผ่าน
        } 
        else {
            return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขผู้ใช้นี้');
        }

        // ดำเนินการอัปเดต
        $input = $this->request->getJSON(true);
        if (!is_array($input)) {
            return $this->failValidationErrors('ข้อมูลที่ส่งมาไม่ถูกต้อง');
        }

        $data = [];
        if (isset($input['Username'])) $data['Username'] = $input['Username'];
        if (isset($input['email'])) $data['email'] = $input['email'];
        if (isset($input['Name'])) $data['Name'] = $input['Name'];
        
        if (isset($input['iduser_level'])) {
            $newLevel = (int) $input['iduser_level'];
            if ($requesterLevel === 2 && $targetLevel === 1 && in_array($newLevel, [1, 2])) {
                $data['iduser_level'] = $newLevel; // อนุญาตเปลี่ยน
            } else {
                unset($data['iduser_level']); // ห้ามเปลี่ยนกรณีอื่น
            }
        }

        if (!empty($input['Password'])) {
            $data['Password'] = password_hash($input['Password'], PASSWORD_DEFAULT);
        }

        if (empty($data)) {
            return $this->failValidationErrors('ไม่มีข้อมูลที่จะแก้ไข');
        }

        $model->update($id, $data);
        $updatedUser = $model->find($id);

        unset($updatedUser['Password']);

        return $this->respond([
            'message' => 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
            'user' => $updatedUser
        ]);
    }

    public function getUserMenu()
    {
        $user = $this->verifyToken(); // ได้ decoded token
        if (!$user) return $this->failUnauthorized();

        $level = $user->iduser_level;

        $menu = [
            ['text' => 'สรุปสถานการณ์น้ำ', 'path' => '/dashboard', 'icon' => 'Dashboard'],
            ['text' => 'สถานีน้ำท่า', 'path' => '/flow', 'icon' => 'Place'],
            // ... เมนูทั่วไป
        ];

        if (in_array($level, [1, 2])) {
            $menu[] = ['text' => 'แบบจำลอง', 'path' => '/model', 'icon' => 'ModelTraining'];
        }

        if ($level === 2) {
            $menu[] = ['text' => 'ตั้งค่า', 'path' => '/setting', 'icon' => 'Settings'];
            $menu[] = ['text' => 'ผู้ใช้งาน', 'path' => '/users', 'icon' => 'Group'];
        }

        return $this->respond(['menu' => $menu]);
    }

        // GET /user/user_temp
   public function user_temp()
    {
        // Check for OPTIONS request for CORS preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $model = new UserTempModel();

        // ดึงผู้ใช้จาก user_temp เฉพาะที่มี Status เป็น 1 (ยืนยันอีเมลแล้ว)
        // Fetch users from user_temp only where Status is 1 (email verified)
        $users = $model->where('Status', 1)->findAll();

        return $this->respond($users);
    }

    // POST /user/approve/{id}
    // app/Controllers/Auth.php

    public function approve($id)
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        $tempModel = new \App\Models\UserTempModel();
        $userModel = new \App\Models\UserModel();

        $tempUser = $tempModel->find($id);
        if (!$tempUser) {
            return $this->failNotFound('ไม่พบผู้ใช้ในคำขอลงทะเบียน');
        }

        // Prepare user data for the main users table
        $userData = [
            'Username' => $tempUser['Username'],
            'email' => $tempUser['email'],
            'Password' => $tempUser['Password'],
            'Name' => $tempUser['Name'],
            'CreateDate' => $tempUser['CreateDate'],
            'Status' => 1, // ตั้งค่าเป็น 1 (Active) เมื่อย้ายไปตารางหลัก
            'iduser_level' => $tempUser['iduser_level'],
        ];

        // Remove temp-specific fields if they exist and are not in main users table
        unset($userData['verification_token']);
        unset($userData['token_expires_at']);
        // Ensure primary key from temp table is not inserted if main table has auto-increment
        if (isset($tempUser[$tempModel->primaryKey])) {
            unset($tempUser[$tempModel->primaryKey]); // Remove primary key from tempUser array if it conflicts
        }
        
        try {
            $userModel->insert($userData); // Insert into main user table
            $tempModel->delete($id); // Delete from temporary table

            return $this->respond([
                'message' => 'ยืนยันผู้ใช้งานและย้ายไปยังบัญชีหลักสำเร็จ',
                'username' => $tempUser['Username']
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Error approving user: ' . $e->getMessage());
            return $this->failServerError('ไม่สามารถยืนยันผู้ใช้งานได้: ' . $e->getMessage());
        }
    }

    public function reject($id)
    {
        $tempModel = new UserTempModel();
        
        // ตรวจสอบว่ามีคำขออยู่หรือไม่
        $user = $tempModel->find($id);
        if (!$user) {
            return $this->failNotFound('ไม่พบคำขอลงทะเบียน');
        }

        // ลบคำขอ
        if ($tempModel->delete($id)) {
            return $this->respondDeleted(['message' => 'ลบคำขอลงทะเบียนสำเร็จ']);
        } else {
            return $this->failServerError('ไม่สามารถลบคำขอได้');
        }
    }

    public function checkAuth()
    {
        $token = $this->request->getCookie('access_token');

        if (!$token) {
            return $this->respond([
                'authenticated' => false,
                'message' => 'No token provided'
            ], 200);   // เปลี่ยนจาก failUnauthorized เป็น 200
        }

        try {
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));

            if (isset($decoded->exp) && $decoded->exp < time()) {
                return $this->respond([
                    'authenticated' => false,
                    'message' => 'Token expired'
                ], 200);
            }

            $iduser_level = isset($decoded->iduser_level) ? (int)$decoded->iduser_level : 0;

            return $this->respond([
                 'authenticated' => true,
                'username' => $decoded->username ?? null,
                'iduser_level' => $iduser_level,
                'name' => $decoded->name ?? null,
                'email' => $decoded->email ?? null,
                'uid' => $decoded->uid ?? null,
                'exp' => $decoded->exp ?? null,
            ], 200);

        } catch (\Exception $e) {
            return $this->respond([
                'authenticated' => false,
                'message' => 'Invalid token'
            ], 200);
        }
    }
}
