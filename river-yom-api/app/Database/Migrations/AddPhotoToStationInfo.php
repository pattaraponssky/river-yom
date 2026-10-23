<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPhotoToStationInfo extends Migration
{
    private array $tables = [
        'rain_info',
        'flow_info',
        'gate_info',
        'tele_info',
        'reservoir_info',
        'sea_info',
    ];

    public function up()
    {
        foreach ($this->tables as $table) {
            if (!$this->db->tableExists($table)) {
                continue;
            }

            if ($this->db->fieldExists('photo', $table)) {
                continue;
            }

            $this->forge->addColumn($table, [
                'photo' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                    'default'    => null,
                ],
            ]);
        }
    }

    public function down()
    {
        foreach ($this->tables as $table) {
            if (!$this->db->tableExists($table)) {
                continue;
            }

            if (!$this->db->fieldExists('photo', $table)) {
                continue;
            }

            $this->forge->dropColumn($table, 'photo');
        }
    }
}
