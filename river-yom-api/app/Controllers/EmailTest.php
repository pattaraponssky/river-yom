<?php 
namespace App\Controllers;
use CodeIgniter\Controller;
use CodeIgniter\Email\Email;

class EmailTest extends Controller
{
    public function send()
    {
        $emailService = service('email');

        $emailService->setTo('pattarapon.ssk.y@gmail.com'); // **CHANGE THIS TO A REAL EMAIL YOU CAN ACCESS**
        $emailService->setSubject('CodeIgniter 4 Email Test SWOC');
        $emailService->setMessage('This is a test email from SWOC Thachin. If you receive this, email setup is working!');

        if ($emailService->send()) {
            echo 'Email sent successfully!';
        } else {
            echo 'Email sending failed: <pre>';
            print_r($emailService->printDebugger(['headers'])); // This gives detailed error
            echo '</pre>';
        }
    }
}