<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->get('api/filterRas', 'API::getFilteredRasOutput');
$routes->get('api/dailySummary', 'API::dailySummary');

///Daily Api///
$routes->group('api/daily', function($routes) {
    $routes->get('reservoir', 'DailyApi::reservoir');
    $routes->get('reservoir/(:segment)', 'DailyApi::reservoir/$1');

    $routes->get('gate', 'DailyApi::gate');
    $routes->get('gate/(:segment)', 'DailyApi::gate/$1');

    $routes->get('flow', 'DailyApi::flow');
    $routes->get('flow/(:segment)', 'DailyApi::flow/$1');

    $routes->get('rain', 'DailyApi::rain');
    $routes->get('rain/(:segment)', 'DailyApi::rain/$1');
});

//////Reservoir API//////
$routes->get('api/reservoir_info', 'ReservoirInfo::index');
$routes->get('api/reservoir_info/(:segment)', 'ReservoirInfo::show/$1');
$routes->post('api/reservoir_info', 'ReservoirInfo::create');
$routes->put('api/reservoir_info/(:segment)', 'ReservoirInfo::update/$1');
$routes->patch('api/reservoir_info/(:segment)', 'ReservoirInfo::update/$1');
$routes->delete('api/reservoir_info/(:segment)', 'ReservoirInfo::delete/$1');

$routes->post('/api/reservoir_preview_update', 'API::previewUpdate');
$routes->put('/api/reservoir_update_data', 'ReservoirAPI::updateData');
$routes->get('/api/reservoir_years', 'ReservoirAPI::reservoir_years'); 
$routes->get('/api/reservoir_data/(:segment)', 'ReservoirAPI::reservoirData/$1'); 
$routes->get('/api/reservoir_rc/(:segment)', 'ReservoirAPI::reservoirRC/$1');
$routes->get('/api/reservoir_data_last_7_days', 'ReservoirAPI::reservoirDataLast7Days');
$routes->get('/api/reservoir_data_last_14_days', 'ReservoirAPI::reservoirDataLast14Days');

//////Flow API//////
$routes->get('api/flow_info', 'FlowInfo::index');
$routes->get('api/flow_info/(:segment)', 'FlowInfo::show/$1');
$routes->post('api/flow_info', 'FlowInfo::create');
$routes->put('api/flow_info/(:segment)', 'FlowInfo::update/$1');
$routes->patch('api/flow_info/(:segment)', 'FlowInfo::update/$1');
$routes->delete('api/flow_info/(:segment)', 'FlowInfo::delete/$1');

$routes->post('/api/flow_preview_update', 'API::previewUpdate');
$routes->put('/api/flow_update_data', 'FlowAPI::updateData');
$routes->get('/api/flow_info', 'FlowAPI::flow_info'); 
$routes->get('/api/flow_data/(:segment)', 'FlowAPI::flowData/$1'); 
$routes->get('/api/flow_years', 'FlowAPI::flow_years'); 
$routes->get('/api/flow_data_last_7_days', 'FlowAPI::flowDataLast7Days');
$routes->get('/api/flow_data_last_14_days', 'FlowAPI::flowDataLast14Days');
$routes->get('/api/flow_today', 'FlowAPI::flowDataTodayByStations');

$routes->get('/api/flow_hourly_data_last_7_days', 'FlowAPI::flowHourlyDataLast7Days');
$routes->get('/api/flow_hourly_years', 'FlowAPI::flowHourly_years'); 
$routes->get('/api/flow_hourly_data/(:segment)', 'FlowAPI::flowHourlyData/$1'); 

$routes->get('jobs/flow_forecast/import_forecast', 'FlowForecast::importFromRasCsv');
$routes->get('api/flow_forecast/(:segment)', 'FlowForecast::flowForecastData/$1'); 
$routes->post('api/flow_forecast/csv', 'FlowForecast::csv');
$routes->post('api/flow_forecast', 'FlowForecast::create');

//////Tele API//////
$routes->get('api/tele_info', 'TeleInfo::index');
$routes->get('api/tele_info/(:segment)', 'TeleInfo::show/$1');
$routes->post('api/tele_info', 'TeleInfo::create');
$routes->put('api/tele_info/(:segment)', 'TeleInfo::update/$1');
$routes->patch('api/tele_info/(:segment)', 'TeleInfo::update/$1');
$routes->delete('api/tele_info/(:segment)', 'TeleInfo::delete/$1');

$routes->post('/api/tele_preview_update', 'API::previewUpdate');
$routes->put('/api/tele_update_data', 'TeleAPI::updateData');
$routes->get('/api/tele_info', 'TeleAPI::tele_info'); 
$routes->get('/api/tele_data/(:segment)', 'TeleAPI::teleData/$1'); 
$routes->get('/api/tele_years', 'TeleAPI::tele_years'); 
$routes->get('/api/tele_data_last_7_days', 'TeleAPI::teleDataLast7Days');
$routes->get('/api/tele_data_last_14_days', 'TeleAPI::teleDataLast14Days');
$routes->get('/api/tele_today', 'TeleAPI::teleDataTodayByStations');

$routes->get('/api/tele_hourly_data_last_7_days', 'TeleAPI::teleHourlyDataLast7Days');
$routes->get('/api/tele_hourly_years', 'TeleAPI::teleHourly_years'); 
$routes->get('/api/tele_hourly_data/(:segment)', 'TeleAPI::teleHourlyData/$1'); 

$routes->get('jobs/tele_forecast/import_forecast', 'TeleForecast::importFromRasCsv');
$routes->get('api/tele_forecast/(:segment)', 'TeleForecast::teleForecastData/$1'); 
$routes->post('api/tele_forecast/csv', 'TeleForecast::csv');
$routes->post('api/tele_forecast', 'TeleForecast::create');

//////Gate API//////
$routes->get('api/gate_info', 'GateInfo::index');
$routes->get('api/gate_info/(:segment)', 'GateInfo::show/$1');
$routes->post('api/gate_info', 'GateInfo::create');
$routes->put('api/gate_info/(:segment)', 'GateInfo::update/$1');
$routes->patch('api/gate_info/(:segment)', 'GateInfo::update/$1');
$routes->delete('api/gate_info/(:segment)', 'GateInfo::delete/$1');

$routes->post('/api/gate_preview_update', 'API::previewUpdate');
$routes->put('/api/gate_update_data', 'GateAPI::updateData');
$routes->get('/api/gate_info', 'GateAPI::gate_info'); 
$routes->get('/api/gate_data/(:segment)', 'GateAPI::gateData/$1'); 
$routes->get('/api/gate_years', 'GateAPI::gate_years'); 
$routes->get('/api/gate_data_last_7_days', 'GateAPI::gateDataLast7Days');
$routes->get('/api/gate_data_last_14_days', 'GateAPI::gateDataLast14Days');

//////Rain API//////
$routes->get('api/rain_info', 'RainInfo::index');
$routes->get('api/rain_info/(:segment)', 'RainInfo::show/$1');
$routes->post('api/rain_info', 'RainInfo::create');
$routes->put('api/rain_info/(:segment)', 'RainInfo::update/$1');
$routes->patch('api/rain_info/(:segment)', 'RainInfo::update/$1');
$routes->delete('api/rain_info/(:segment)', 'RainInfo::delete/$1');

$routes->post('/api/rain_preview_update', 'API::previewUpdate');
$routes->put('/api/rain_update_data', 'RainAPI::updateData');
$routes->get('/api/rain_info', 'RainAPI::rain_info');
$routes->get('/api/rain_data/(:segment)', 'RainAPI::rainData/$1');
$routes->get('/api/rain_monthly/(:segment)',  'RainAPI::monthly/$1');
$routes->get('/api/rain_yearly/(:segment)',   'RainAPI::yearly/$1');
$routes->get('/api/rain_years', 'RainAPI::rain_years');
$routes->get('/api/rain_data_last_7_days', 'RainAPI::rainDataLast7Days'); 
$routes->get('/api/rain_data_last_14_days', 'RainAPI::rainDataLast14Days');

//////Sea API//////
$routes->post('/api/sea_preview_update', 'API::previewUpdate');
$routes->put('/api/sea_update_data', 'SeaAPI::updateData');
$routes->get('api/sea_info', 'SeaInfo::index');
$routes->get('api/sea_info/(:segment)', 'SeaInfo::show/$1');
$routes->post('api/sea_info', 'SeaInfo::create');
$routes->put('api/sea_info/(:segment)', 'SeaInfo::update/$1');
$routes->patch('api/sea_info/(:segment)', 'SeaInfo::update/$1');
$routes->delete('api/sea_info/(:segment)', 'SeaInfo::delete/$1');
$routes->get('/api/sea_info', 'SeaAPI::sea_info');
$routes->get('/api/sea_data/(:segment)', 'SeaAPI::seaData/$1');
$routes->get('/api/sea_years', 'SeaAPI::sea_years');
$routes->get('/api/sea_data_today', 'SeaAPI::SeaDataToday'); 
$routes->get('/api/sea_range', 'SeaAPI::SeaDataRange');
$routes->get('/api/sea_data_current_year', 'SeaAPI::seaDataCurrentYear'); 

//////USER//////
$routes->group('user', function($routes) {
    $routes->post('login', 'User::login');
    $routes->post('logout', 'User::logout');
    $routes->post('register', 'User::register');
    $routes->post('forgotPassword', 'User::forgotPassword');
    $routes->post('resetPassword', 'User::resetPassword');
    $routes->post('validateResetToken', 'User::validateResetToken');
    $routes->get('checkAuth', 'User::checkAuth');
    $routes->get('getUserByUsername/(:segment)', 'User::getUserByUsername/$1');
    $routes->put('updateUser/(:any)', 'User::updateUser/$1');
    $routes->get('users', 'User::getAllUsers');
    $routes->put('users/(:num)', 'User::updateUserById/$1');
    $routes->get('user_temp', 'User::user_temp');
    $routes->post('approve/(:num)', 'User::approve/$1');
    $routes->delete('reject/(:num)', 'User::reject/$1');
    
});

$routes->resource('api/model_input_data', [
    'controller' => 'ModelInputDataController',
    'only' => ['index', 'create'] // อนุญาตเฉพาะ GET (index) และ POST (create)
]);

$routes->post('api/model_input_data/update-from-main', 'ModelInputDataController::updateFromMain');
$routes->get('verify-email', 'User::verifyEmail');

//////JOBS//////
$routes->group('jobs', function($routes) {
    $routes->get('updateReservoirData', 'Jobs::updateReservoirData');
    $routes->get('updateFlowData', 'Jobs::updateFlowData');
    $routes->get('updateFlowHourlyData', 'Jobs::updateFlowDataHourly');
    $routes->get('updateGateData', 'Jobs::updateGateData');
    $routes->get('updateRainData', 'Jobs::updateRainData');
    $routes->get('updateRainFillData/(:any)/(:any)', 'Jobs::updateRainFillData/$1/$2');
    $routes->get('updateReservoirFillData/(:any)/(:any)', 'Jobs::updateReservoirFillData/$1/$2');
    $routes->get('updateFlowFillData/(:any)/(:any)', 'Jobs::updateFlowFillData/$1/$2');
    $routes->get('updateFlowHourlyFillData/(:any)/(:any)', 'Jobs::updateFlowHourlyFillData/$1/$2');
    $routes->get('updateGateFillData/(:any)/(:any)', 'Jobs::updateGateFillData/$1/$2');

    // Cron job endpoint (trigger หลัง run HEC-RAS)
    $routes->get('importForecast', 'FlowForecastController::importFromCsv');
});

$routes->group('/api/forecast', function ($routes) {
    $routes->post('import-csv',  'FlowForecastController::importFromCsv');
    $routes->get('data',         'FlowForecastController::getForecastData');
    $routes->get('latest',       'FlowForecastController::getLatest');
    $routes->get('preview-csv',  'FlowForecastController::previewCsv');
    $routes->delete('clear',     'FlowForecastController::clearForecast');
});

// $routes->group('/api/equipment', ['filter' => 'jwt'], function ($routes) {
$routes->group('/api/equipments',  function ($routes) {
    $routes->get('/', 'Equipment::index');                  // หน้ารายการอุปกรณ์
    $routes->post('/', 'Equipment::create');
    $routes->get('edit/(:num)', 'Equipment::edit/$1');     // ฟอร์มแก้ไข
    $routes->post('update/(:num)', 'Equipment::update/$1'); // บันทึกแก้ไข
    $routes->post('delete/(:num)', 'Equipment::delete/$1'); // ลบ

    // ประวัติการทำงาน + บำรุงรักษา
    $routes->get('(:num)/logs', 'Equipment::logs/$1');     // ประวัติการทำงาน
    $routes->post('(:num)/log/store', 'Equipment::storeLog/$1');

    $routes->get('(:num)/maintenance', 'Equipment::maintenance/$1');
    $routes->post('(:num)/maintenance', 'Equipment::createMaintenance/$1');
    $routes->put('(:num)/maintenance/(:num)', 'Equipment::updateMaintenance/$1/$2');
    $routes->delete('(:num)/maintenance/(:num)', 'Equipment::deleteMaintenance/$1/$2');

    // รายงาน
    $routes->get('report', 'Equipment::report');
});

$routes->group('aboutus', function($routes) {
    $routes->get('/', 'AboutUs::index');
    $routes->put('update/(:num)', 'AboutUs::update/$1');
});

$routes->options('(:any)', 'CorsController::preflight');

$routes->get('snapshot/run/(:segment)', 'SaveForecastSnapshot::run/$1'); //SwocThachinForecastSnapshot2025

// Email Alert Routes
$routes->get('jobs/dailyFloodAlert',  'EmailAlertController::sendDailyAlert');
$routes->get('jobs/previewAlert',     'EmailAlertController::previewAlert');
