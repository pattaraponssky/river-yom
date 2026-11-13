<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Libraries\AuthContext;
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

    private function safeUserFields(): string
    {
        return 'User_ID, Username, Name, email, CreateDate, Status, iduser_level';
    }

    private function cookieOptions(int $expires): array
    {
        return [
            'expires'  => $expires,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $this->request->isSecure(),
            'httponly' => true,
            'samesite' => 'Strict',
        ];
    }

    private function frontendBaseUrl(): string
    {
        $url = trim((string) env('FRONTEND_URL'));
        if ($url === '') {
            $url = 'https://wms-yom-right.rid.go.th/river-yom';
        }

        return rtrim($url, '/');
    }

    private function currentUser(): ?object
    {
        if (AuthContext::$user !== null) {
            return AuthContext::$user;
        }

        $token = $this->request->getCookie('access_token');
        if (!$token || !$this->key) {
            return null;
        }

        try {
            return JWT::decode($token, new Key($this->key, 'HS256'));
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function findUserByResetToken(UserModel $model, string $token): ?array
    {
        $user = $model->where('reset_token', hash('sha256', $token))->first();
        if (!$user) {
            $user = $model->where('reset_token', $token)->first();
        }

        return $user ?: null;
    }

    private function validPassword(string $password): bool
    {
        $length = strlen($password);

        return $length >= 8 && $length <= 72;
    }

    private function requireAdmin(): ?object
    {
        $user = $this->currentUser();

        if (!$user || (int) ($user->iduser_level ?? 0) < 2) {
            return null;
        }

        return $user;
    }

    public function verifyToken()
    {
        $jwt = $this->request->getCookie('access_token');
        if (!$jwt || !$this->key) {
            return false;
        }

        try {
            return JWT::decode($jwt, new Key($this->key, 'HS256'));
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function login()
    {
        if (!$this->key) {
            log_message('critical', 'JWT_SECRET is not configured');
            return $this->failServerError('ไม่สามารถเข้าสู่ระบบได้ในขณะนี้');
        }

        $username = trim((string) $this->request->getPost('username'));
        $password = (string) $this->request->getPost('password');
        $genericError = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';

        if ($username === '' || $password === '') {
            return $this->failUnauthorized($genericError);
        }

        $model = new UserModel();
        $user = $model->where('Username', $username)->first();

        if (!$user) {
            // Keep timing similar for unknown usernames.
            password_verify($password, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
            log_message('warning', 'Failed login for unknown user from IP {ip}', ['ip' => $this->request->getIPAddress()]);
            return $this->failUnauthorized($genericError);
        }

        if (($user['Status'] !== null && (int) $user['Status'] !== 1)
            || !password_verify($password, (string) $user['Password'])) {
            log_message('warning', 'Failed login for {username} from IP {ip}', [
                'username' => $username,
                'ip'       => $this->request->getIPAddress(),
            ]);
            return $this->failUnauthorized($genericError);
        }

        $payload = [
            'iss' => 'https://wms-yom-right.rid.go.th/river-yom-api/',
            'aud' => 'https://wms-yom-right.rid.go.th/river-yom-api/',
            'iat' => time(),
            'exp' => time() + 7200,
            'uid' => (int) $user['User_ID'],
            'username' => $user['Username'],
            'iduser_level' => (int) $user['iduser_level'],
            'email' => $user['email'],
            'name' => $user['Name'],
        ];

        $token = JWT::encode($payload, $this->key, 'HS256');

        setcookie('access_token', $token, $this->cookieOptions(time() + 7200));

        return $this->respond([
            'message' => 'เข้าสู่ระบบสำเร็จ',
        ]);
    }

    public function logout()
    {
        setcookie('access_token', '', $this->cookieOptions(time() - 7200));
        return $this->respond(['message' => 'ออกจากระบบแล้ว']);
    }

    public function register()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $username = trim((string) $this->request->getPost('username'));
        $name = trim((string) $this->request->getPost('name'));
        $email = trim((string) $this->request->getPost('email'));
        $password = (string) $this->request->getPost('password');

        if ($username === '' || $name === '' || $email === '' || $password === '') {
            return $this->failValidationErrors('กรุณากรอกข้อมูลให้ครบ');
        }

        if (!preg_match('/^[\p{L}\p{N}._-]{3,50}$/u', $username)) {
            return $this->failValidationErrors('ชื่อผู้ใช้ต้องมี 3-50 ตัวอักษร และใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดล่าง หรือขีดกลาง');
        }

        if (mb_strlen($name) > 255) {
            return $this->failValidationErrors('ชื่อยาวเกินไป');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
            return $this->failValidationErrors('รูปแบบอีเมลไม่ถูกต้อง');
        }

        if (!$this->validPassword($password)) {
            return $this->failValidationErrors('รหัสผ่านต้องมี 8-72 ตัวอักษร');
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

        // 1. Generate a unique verification token. Only the hash is stored.
        $verificationToken = bin2hex(random_bytes(32));
        $tokenExpiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $data = [
            'Username' => $username,
            'email' => $email,
            'Password' => $hashedPassword,
            'Name' => $name,
            'CreateDate' => date('Y-m-d H:i:s'),
            'Status' => 0,
            'iduser_level' => 1,
            'verification_token' => hash('sha256', $verificationToken),
            'token_expires_at' => $tokenExpiresAt,
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
        $emailService->setSubject('ยืนยันการสมัครสมาชิก SWOC แม่ยมฝั่งขวา'); // เปลี่ยนเป็นชื่อแอปของคุณ

        $verificationLink = $this->frontendBaseUrl() . '/verify-email?token=' . $verificationToken;

        // Important: If your frontend is on a different domain/port, replace base_url() with your frontend URL
        // Example: $verificationLink = 'http://localhost:3000/verify-email?token=' . $verificationToken;

        $message = "
            <html>
            <head>
                <title>ยืนยันการสมัครสมาชิก</title>
            </head>
            <body>
                <p>เรียนคุณ $name,</p>
                <p>ขอบคุณสำหรับการสมัครสมาชิกกับ SWOC แม่ยมฝั่งขวา.</p>
                <p>กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันบัญชีของคุณ:</p>
                <p><a href=\"{$verificationLink}\">ยืนยันบัญชีของฉัน</a></p>
                <p>หากคุณไม่ได้สมัครสมาชิก กรุณาละเว้นอีเมลนี้.</p>
                <p>ขอแสดงความนับถือ,</p>
                <p>ทีมงาน SWOC แม่ยมฝั่งขวา</p>
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

        $token = trim((string) $this->request->getGet('token'));

        if ($token === '') {
            return $this->fail('ลิงก์ยืนยันไม่สมบูรณ์ หรือไม่มี Token', 400);
        }

        $tempModel = new \App\Models\UserTempModel();

        // 1. ค้นหาด้วย hash ก่อน แล้วค่อยรองรับ token แบบเดิมที่ยังค้างอยู่ในระบบ
        $user = $tempModel->where('verification_token', hash('sha256', $token))->first();
        if (!$user) {
            $user = $tempModel->where('verification_token', $token)->first();
        }

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
        if (empty($user['token_expires_at']) || strtotime($user['token_expires_at']) < time()) {
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
            'verification_token' => null,
            'token_expires_at' => null,
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
        $email = trim((string) $this->request->getPost('email'));
        $genericResponse = ['message' => 'หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว'];

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->respond($genericResponse);
        }

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->respond($genericResponse);
        }

        $resetToken = bin2hex(random_bytes(32));
        $tokenExpires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $userModel->update($user['User_ID'], [
            'reset_token' => hash('sha256', $resetToken),
            'reset_expires_at' => $tokenExpires,
        ]);

        $emailService = service('email');
        $emailService->setTo($email);
        $emailService->setSubject('รีเซ็ตรหัสผ่าน SWOC แม่ยมฝั่งขวา');

        $resetLink = $this->frontendBaseUrl() . '/reset-password?token=' . $resetToken;

        $message = "
            <p>เรียนคุณ {$user['Name']},</p>
            <p>มีการร้องขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ.</p>
            <p>กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์จะหมดอายุภายใน 1 ชั่วโมง):</p>
            <p><a href='{$resetLink}'>รีเซ็ตรหัสผ่านของฉัน</a></p>
            <p>หากคุณไม่ได้ร้องขอ โปรดละเว้นอีเมลนี้.</p>
        ";

        $emailService->setMessage($message);

        if (!$emailService->send()) {
            log_message('error', 'Failed to send reset password email: ' . $emailService->printDebugger(['headers']));
        }

        return $this->respond($genericResponse);
    }

    public function resetPassword()
    {
        $token = trim((string) $this->request->getPost('token'));
        $newPassword = (string) $this->request->getPost('password');

        if ($token === '' || $newPassword === '') {
            return $this->failValidationErrors('กรุณากรอกข้อมูลให้ครบ');
        }

        if (!$this->validPassword($newPassword)) {
            return $this->failValidationErrors('รหัสผ่านต้องมี 8-72 ตัวอักษร');
        }

        $userModel = new UserModel();
        $user = $this->findUserByResetToken($userModel, $token);

        if (!$user) {
            return $this->failNotFound('Token ไม่ถูกต้อง');
        }

        if (empty($user['reset_expires_at']) || strtotime($user['reset_expires_at']) < time()) {
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
        $token = trim((string) $this->request->getPost('token'));
        if ($token === '') {
            return $this->failValidationErrors('กรุณาส่ง Token');
        }

        $userModel = new UserModel();
        $user = $this->findUserByResetToken($userModel, $token);

        if (!$user) {
            return $this->respond(['valid' => false, 'message' => 'Token ไม่ถูกต้อง']);
        }

        if (empty($user['reset_expires_at']) || strtotime($user['reset_expires_at']) < time()) {
            return $this->respond(['valid' => false, 'message' => 'Token หมดอายุ']);
        }

        return $this->respond(['valid' => true]);
    }
    public function getUserByUsername($username)
    {
        if (!$this->requireAdmin()) {
            return $this->failForbidden('Forbidden');
        }

        $model = new UserModel();
        $user = $model->select($this->safeUserFields())->where('Username', $username)->first();

        if (!$user) {
            return $this->failNotFound('ไม่พบผู้ใช้');
        }

        return $this->respond($user);
    }


    
    public function getAllUsers()
    {
        if (!$this->requireAdmin()) {
            return $this->failForbidden('Forbidden');
        }

        $model = new UserModel();
        $users = $model->select($this->safeUserFields())->findAll();

        return $this->respond($users);
    }

    public function updateUser($username = null)
    {
        $decoded = $this->currentUser();
        if (!$decoded) {
            return $this->failUnauthorized('Unauthorized');
        }

        $model = new UserModel();
        $user = $model->where('Username', $username)->first();
        if (!$user) {
            return $this->failNotFound('ไม่พบผู้ใช้งาน');
        }

        $isAdmin = (int) ($decoded->iduser_level ?? 0) >= 2;
        $isSelf = isset($decoded->username) && strcasecmp((string) $decoded->username, (string) $user['Username']) === 0;

        if (!$isAdmin && !$isSelf) {
            return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้รายนี้');
        }

        $input = $this->request->getJSON(true) ?? $this->request->getRawInput();
        if (!is_array($input)) {
            return $this->failValidationErrors('ข้อมูลที่ส่งมาไม่ถูกต้อง');
        }

        $data = [];

        if (array_key_exists('email', $input)) {
            $email = trim((string) $input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
                return $this->failValidationErrors('รูปแบบอีเมลไม่ถูกต้อง');
            }

            $exists = $model->where('email', $email)
                ->where('User_ID !=', $user['User_ID'])
                ->first();
            if ($exists) {
                return $this->failValidationErrors('อีเมลนี้ถูกใช้งานแล้ว');
            }

            $data['email'] = $email;
        }

        $name = $input['Name'] ?? $input['name'] ?? null;
        if ($name !== null) {
            $name = trim((string) $name);
            if ($name === '' || mb_strlen($name) > 255) {
                return $this->failValidationErrors('ชื่อไม่ถูกต้อง');
            }
            $data['Name'] = $name;
        }

        $password = $input['Password'] ?? $input['password'] ?? null;
        if ($password !== null && $password !== '') {
            $password = (string) $password;
            if (!$this->validPassword($password)) {
                return $this->failValidationErrors('รหัสผ่านต้องมี 8-72 ตัวอักษร');
            }

            if ($isSelf) {
                $currentPassword = (string) ($input['current_password'] ?? $input['currentPassword'] ?? '');
                if ($currentPassword === '' || !password_verify($currentPassword, (string) $user['Password'])) {
                    return $this->failUnauthorized('รหัสผ่านปัจจุบันไม่ถูกต้อง');
                }
            }

            $data['Password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        if (empty($data)) {
            return $this->failValidationErrors('ไม่มีข้อมูลที่จะอัปเดต');
        }

        $model->update($user['User_ID'], $data);

        $updatedUser = $model->select($this->safeUserFields())->find($user['User_ID']);

        return $this->respond([
            'message' => 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
            'user' => $updatedUser
        ]);
    }

    public function updateUserById($id)
    {
        $decoded = $this->requireAdmin();
        if (!$decoded) {
            return $this->failForbidden('Forbidden');
        }

        $requesterLevel = (int) ($decoded->iduser_level ?? 0);
        $requesterId = (int) ($decoded->uid ?? 0);

        if ($requesterLevel < 2) {
            return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้คนอื่น');
        }

        $model = new UserModel();
        $targetUser = $model->find($id);
        if (!$targetUser) {
            return $this->failNotFound('ไม่พบผู้ใช้งาน');
        }

        $targetId = (int) $targetUser['User_ID'];
        $targetLevel = (int) ($targetUser['iduser_level'] ?? 0);
        $isSelf = $requesterId === $targetId;

        if (!$isSelf) {
            if ($requesterLevel === 2 && $targetLevel !== 1) {
                return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลของผู้ดูแลระบบอื่น');
            }

            if ($requesterLevel !== 2) {
                return $this->failForbidden('คุณไม่มีสิทธิ์แก้ไขผู้ใช้นี้');
            }
        }

        $input = $this->request->getJSON(true);
        if (!is_array($input)) {
            return $this->failValidationErrors('ข้อมูลที่ส่งมาไม่ถูกต้อง');
        }

        $data = [];

        if (array_key_exists('Username', $input)) {
            $username = trim((string) $input['Username']);
            if (!preg_match('/^[\p{L}\p{N}._-]{3,50}$/u', $username)) {
                return $this->failValidationErrors('ชื่อผู้ใช้ไม่ถูกต้อง');
            }

            $exists = $model->where('Username', $username)
                ->where('User_ID !=', $targetId)
                ->first();
            if ($exists) {
                return $this->failValidationErrors('ชื่อผู้ใช้นี้มีในระบบแล้ว');
            }

            $data['Username'] = $username;
        }

        if (array_key_exists('email', $input)) {
            $email = trim((string) $input['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
                return $this->failValidationErrors('รูปแบบอีเมลไม่ถูกต้อง');
            }

            $exists = $model->where('email', $email)
                ->where('User_ID !=', $targetId)
                ->first();
            if ($exists) {
                return $this->failValidationErrors('อีเมลนี้ถูกใช้งานแล้ว');
            }

            $data['email'] = $email;
        }

        if (array_key_exists('Name', $input)) {
            $name = trim((string) $input['Name']);
            if ($name === '' || mb_strlen($name) > 255) {
                return $this->failValidationErrors('ชื่อไม่ถูกต้อง');
            }
            $data['Name'] = $name;
        }

        if (isset($input['iduser_level'])) {
            $newLevel = (int) $input['iduser_level'];
            if ($requesterLevel === 2 && $targetLevel === 1 && in_array($newLevel, [1, 2], true)) {
                $data['iduser_level'] = $newLevel;
            }
        }

        if (!empty($input['Password'])) {
            $password = (string) $input['Password'];
            if (!$this->validPassword($password)) {
                return $this->failValidationErrors('รหัสผ่านต้องมี 8-72 ตัวอักษร');
            }

            if ($isSelf) {
                $currentPassword = (string) ($input['current_password'] ?? $input['currentPassword'] ?? '');
                if ($currentPassword === '' || !password_verify($currentPassword, (string) $targetUser['Password'])) {
                    return $this->failUnauthorized('รหัสผ่านปัจจุบันไม่ถูกต้อง');
                }
            }

            $data['Password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        if (empty($data)) {
            return $this->failValidationErrors('ไม่มีข้อมูลที่จะแก้ไข');
        }

        $model->update($targetId, $data);
        $updatedUser = $model->select($this->safeUserFields())->find($targetId);

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

        if (!$this->requireAdmin()) {
            return $this->failForbidden('Forbidden');
        }

        $model = new UserTempModel();

        // ดึงผู้ใช้จาก user_temp เฉพาะที่มี Status เป็น 1 (ยืนยันอีเมลแล้ว)
        // Fetch users from user_temp only where Status is 1 (email verified)
        $users = $model->select('User_ID, Username, Name, email, CreateDate, Status, iduser_level')
            ->where('Status', 1)
            ->findAll();

        return $this->respond($users);
    }

    // POST /user/approve/{id}
    // app/Controllers/Auth.php

    public function approve($id)
    {
        if (!$this->requireAdmin()) {
            return $this->failForbidden('Forbidden');
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
        if (!$this->requireAdmin()) {
            return $this->failForbidden('Forbidden');
        }

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

        if (!$token || !$this->key) {
            return $this->respond([
                'authenticated' => false,
                'message' => 'No token provided'
            ], 200);
        }

        try {
            $decoded = JWT::decode($token, new Key($this->key, 'HS256'));

            if (isset($decoded->exp) && $decoded->exp < time()) {
                return $this->respond([
                    'authenticated' => false,
                    'message' => 'Token expired'
                ], 200);
            }

            $uid = (int) ($decoded->uid ?? 0);
            $user = $uid > 0
                ? (new UserModel())->select($this->safeUserFields())->find($uid)
                : null;

            if (!$user || ($user['Status'] !== null && (int) $user['Status'] !== 1)) {
                return $this->respond([
                    'authenticated' => false,
                    'message' => 'User is not active'
                ], 200);
            }

            return $this->respond([
                'authenticated' => true,
                'username' => $user['Username'],
                'iduser_level' => (int) $user['iduser_level'],
                'name' => $user['Name'],
                'email' => $user['email'],
                'uid' => (int) $user['User_ID'],
                'exp' => $decoded->exp ?? null,
            ], 200);

        } catch (\Throwable $e) {
            return $this->respond([
                'authenticated' => false,
                'message' => 'Invalid token'
            ], 200);
        }
    }
}
