<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use CodeIgniter\HTTP\IncomingRequest;

class JwtAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // อ่าน token จาก cookie 'access_token' (ระบบของคุณใช้แบบนี้)
         if ($request instanceof IncomingRequest) {
            $token = $request->getCookie('access_token');
        } else {
            $token = null;
        }
        
        if (!$token) {
            return redirect()->to('/dashboard');
        }

        $key = env('JWT_SECRET');

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            if (isset($decoded->exp) && $decoded->exp < time()) {
                return redirect()->to('/login?expired=1');
            }

            $request->user = $decoded;

            if ($arguments) {
                $requiredLevel = (int) $arguments[0];
                $userLevel = (int) ($decoded->iduser_level ?? 0);

                if ($userLevel < $requiredLevel) {
                    return redirect()->to('/unauthorized');
                }
            }
        } catch (\Exception $e) {
            return redirect()->to('/login?invalid=1');
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // ไม่ต้องทำอะไร
    }
}