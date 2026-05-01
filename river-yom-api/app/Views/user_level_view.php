<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Levels</title>
</head>
<body>
    <h1>ระดับของผู้ใช้งาน</h1>
    <table border="1">
        <thead>
            <tr>
                <th>ID</th>
                <th>ระดับผู้ใช้งาน</th>
                <th>คำอธิบาย</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($user_levels as $level): ?>
                <tr>
                    <td><?= $level->id ?></td>
                    <td><?= $level->level_name ?></td>
                    <td><?= $level->description ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</body>
</html>
