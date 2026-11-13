<?php

namespace App\Filters;

use App\Libraries\AuthContext;
use App\Models\UserModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $token = $request instanceof IncomingRequest ? $request->getCookie('access_token') : null;
        if (!$token) {
            return $this->deny('Unauthorized', 401);
        }

        $key = env('JWT_SECRET');
        if (!$key) {
            log_message('critical', 'JWT_SECRET is not configured');
            return $this->deny('Authentication is not configured', 500);
        }

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
        } catch (Throwable $e) {
            return $this->deny('Invalid or expired token', 401);
        }

        $uid = (int) ($decoded->uid ?? 0);
        $user = $uid > 0
            ? (new UserModel())
                ->select('User_ID, Username, Name, email, Status, iduser_level')
                ->find($uid)
            : null;

        if (!$user || ($user['Status'] !== null && (int) $user['Status'] !== 1)) {
            return $this->deny('Unauthorized', 401);
        }

        $decoded->uid = (int) $user['User_ID'];
        $decoded->username = $user['Username'];
        $decoded->name = $user['Name'];
        $decoded->email = $user['email'];
        $decoded->iduser_level = (int) ($user['iduser_level'] ?? 0);

        AuthContext::$user = $decoded;

        $requiredLevel = (int) (is_array($arguments) ? ($arguments[0] ?? 0) : $arguments);
        if ($requiredLevel > 0 && (int) $decoded->iduser_level < $requiredLevel) {
            return $this->deny('Forbidden', 403);
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }

    private function deny(string $message, int $status): ResponseInterface
    {
        $response = service('response')->setStatusCode($status)->setJSON([
            'status' => 'error',
            'message' => $message,
        ]);

        $origin = service('request')->getHeaderLine('Origin');
        $allowedOrigins = config('Cors')->default['allowedOrigins'] ?? [];
        if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
            $response->setHeader('Access-Control-Allow-Origin', $origin);
            $response->setHeader('Access-Control-Allow-Credentials', 'true');
            $response->setHeader('Vary', 'Origin');
        }

        return $response;
    }
}
