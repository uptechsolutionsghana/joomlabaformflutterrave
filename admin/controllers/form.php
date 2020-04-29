<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

jimport('joomla.application.component.controllerform');

class BaformsControllerForm extends JControllerForm
{
    public function getAcymailingFields()
    {
        $fields = baformsHelper::getAcymailingFields();
        $str = json_encode($fields);
        print_r($str);exit;
    }

    public function setZohoCRMTempData()
    {
        $input = JFactory::getApplication()->input;
        $user = JFactory::getUser();
        $data = new stdClass();
        $data->host = $input->get('host', '', 'string');
        $data->email = $input->get('email', '', 'string');
        $data->client_id = $input->get('client_id', '', 'string');
        $data->client_secret = $input->get('client_secret', '', 'string');
        $data->redirect_uri = $input->get('redirect_uri', '', 'string');
        baformsHelper::setZohoCRMTempData($data);
        $grant_token = $input->get('grant_token', '', 'string');
        $dir = JPATH_ROOT.'/components/com_baforms/libraries/zoho-crm/zoho.php';
        require_once $dir;
        $zoho = new zoho($data);
        $zoho->generateAccessToken($grant_token);
        $fields = $zoho->getFields();
        $str = json_encode($fields);
        print_r($str);
        exit;
        
    }

    public function getZohoCRMFields()
    {
        $dir = JPATH_ROOT.'/components/com_baforms/libraries/zoho-crm/zoho.php';
        require_once $dir;
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('*')
            ->from('#__baforms_api')
            ->where('service = '.$db->quote('zoho_temp'));
        $db->setQuery($query);
        $obj = $db->loadObject();
        $data = json_decode($obj->key);
        $zoho = new zoho($data);
        $fields = $zoho->getFields();
        $str = json_encode($fields);
        print_r($str);
        exit;
    }

    public function getActivecampaignLists()
    {
        $input = JFactory::getApplication()->input;
        $api_key = $input->get('api_key', '', 'string');
        $account = $input->get('account', '', 'string');
        require_once JPATH_ROOT.'/components/com_baforms/libraries/activecampaign/activecampaign.php';
        $activecampaign = new activecampaign($account, $api_key);
        $data = $activecampaign->getLists();
        $str = json_encode($data);
        echo $str;exit;
    }

    public function getCampaignLists()
    {
        $input = JFactory::getApplication()->input;
        $api_key = $input->get('api_key', '', 'string');
        $client_id = $input->get('client_id', '', 'string');
        require_once JPATH_ROOT.'/components/com_baforms/libraries/campaign-monitor/campaign.php';
        $campaign = new campaign($api_key, $client_id);
        $data = $campaign->getLists();
        $str = json_encode($data);
        echo $str;exit;
    }

    public function getCampaignFields()
    {
        $input = JFactory::getApplication()->input;
        $api_key = $input->get('api_key', '', 'string');
        $client_id = $input->get('client_id', '', 'string');
        $list_id = $input->get('list_id', '', 'string');
        require_once JPATH_ROOT.'/components/com_baforms/libraries/campaign-monitor/campaign.php';
        $campaign = new campaign($api_key, $client_id, $list_id);
        $data = $campaign->getFields();
        $str = json_encode($data);
        echo $str;exit;
    }

    public function getResponseLists()
    {
        $input = JFactory::getApplication()->input;
        $api_key = $input->get('api_key', '', 'string');
        require_once JPATH_ROOT.'/components/com_baforms/libraries/getresponse/getresponse.php';
        $getresponse = new getresponse($api_key);
        $data = $getresponse->getLists();
        $str = json_encode($data);
        echo $str;exit;
    }

    public function getResponseFields()
    {
        $input = JFactory::getApplication()->input;
        $api_key = $input->get('api_key', '', 'string');
        $list_id = $input->get('list_id', '', 'string');
        require_once JPATH_ROOT.'/components/com_baforms/libraries/getresponse/getresponse.php';
        $getresponse = new getresponse($api_key, $list_id);
        $data = $getresponse->getFields();
        $str = json_encode($data);
        echo $str;exit;
    }

    public function getFormsTemplate()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $model = $this->getModel();
        $data = $model->getFormsTemplate($id);
        echo $data;exit;
    }

    public function createTemplate()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $group = $input->get('group', '', 'string');
        $model = $this->getModel();
        $model->createTemplate($id, $group);
        exit();
    }

    public function installTemplate()
    {
        $model = $this->getModel();
        $model->installTemplate();
    }

    public function saveIntegration()
    {
        baformsHelper::checkUserEditLevel();
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $data = $input->get('obj', '', 'raw');
        $obj = json_decode($data);
        $model = $this->getModel();
        $model->saveIntegration($id, $obj);
        exit();
    }

    public function checkState()
    {
        $str = baformsHelper::checkFormsActivation();
        echo $str;exit;
    }

    public function getRecaptchaData()
    {
        $model = $this->getModel();
        $data = $model->getRecaptchaData();
        header('Content-Type: text/javascript');
        echo 'var recaptchaData = '.$data;
        exit();
    }

    public function formsSave()
    {
        baformsHelper::checkUserEditLevel();
        $data = file_get_contents('php://input');
        $obj = json_decode($data);
        $model = $this->getModel();
        $model->formsSave($obj);
    }

    public function formsAjaxSave()
    {
        baformsHelper::checkUserEditLevel();
        $input = JFactory::getApplication()->input;
        $data = $input->get('obj', '', 'raw');
        $obj = json_decode($data);
        $model = $this->getModel();
        $model->formsSave($obj);
    }

    public function getFormShortCodes()
    {
        $model = $this->getModel();
        $obj = $model->getFormShortCodes();
        $formShortCodes = json_encode($obj);
        header('Content-Type: text/javascript');
        echo 'var formShortCodes = '.$formShortCodes;
        exit();
    }

    public function getFormOptions()
    {
        $model = $this->getModel();
        $obj = $model->getFormOptions();
        $formOptions = json_encode($obj);
        header('Content-Type: text/javascript');
        echo 'var formOptions = '.$formOptions;
        exit();
    }

    public function edit($key = null, $urlVar = null )
    {
        if (!JFactory::getUser()->authorise('core.edit', 'com_baforms')) {
            $this->setRedirect('index.php?option=com_baforms', JText::_('JERROR_ALERTNOAUTHOR'), 'error');
            return false;
        }
        $cid = $this->input->post->get('cid', array(), 'array');
        if (empty($cid)) {
            $cid[0] = $this->input->get('id');
        }
        $url = 'index.php?option=com_baforms&view=form&id='.$cid[0];
        $this->setRedirect($url);
    }

    public function createForm()
    {
        $input = JFactory::getApplication()->input;
        $title = $input->get('title', '', 'string');
        $model = $this->getModel();
        $id = $model->createForm($title);
        echo $id;
        exit();
    }

    public function getWorkSheetsColumns()
    {
        $model = $this->getModel();
        $input = JFactory::getApplication()->input;
        $accessToken = $input->get('accessToken', '', 'raw');
        $spreadsheetStr = $input->get('spreadsheet', '', 'raw');
        $spreadsheet = json_decode($spreadsheetStr);
        $worksheetStr = $input->get('worksheet', '', 'raw');
        $worksheet = json_decode($worksheetStr);
        $columns = $model->getWorkSheetsColumns($accessToken, $spreadsheet, $worksheet);
        echo $columns;
        exit;
    }

    public function getWorkSheets()
    {
        $model = $this->getModel();
        $input = JFactory::getApplication()->input;
        $accessToken = $input->get('accessToken', '', 'raw');
        $spreadsheetStr = $input->get('spreadsheet', '', 'raw');
        $spreadsheet = json_decode($spreadsheetStr);
        $sheets = $model->getWorkSheets($accessToken, $spreadsheet);
        echo $sheets;
        exit;
    }

    public function getSpreadSheets()
    {
        $input = JFactory::getApplication()->input;
        $token = $input->get('token', '', 'string');
        $model = $this->getModel();
        $sheets = $model->getSpreadSheets($token);
        echo $sheets;
        exit;
    }

    public function createSheetsToken()
    {
        $input = JFactory::getApplication()->input;
        $code = $input->get('code', '', 'string');
        $model = $this->getModel();
        $sheets = $model->createSheetsToken($code);
        echo $sheets;
        exit;
    }

    public function createDriveToken()
    {
        $input = JFactory::getApplication()->input;
        $code = $input->get('code', '', 'string');
        $model = $this->getModel();
        $drive = $model->createDriveToken($code);
        echo $drive;
        exit;
    }

    public function getDriveFolders()
    {
        $input = JFactory::getApplication()->input;
        $token = $input->get('token', '', 'string');
        $model = $this->getModel();
        $sheets = $model->getDriveFolders($token);
        echo $sheets;
        exit;
    }

    public function getSession()
    {
        $session = JFactory::getSession();
        echo new JResponseJson($session->getState());
        exit;
    }

    public function connectMailChimp()
    {
        $input = JFactory::getApplication()->input;
        $apikey = $input->get('api_key', '', 'string');
        $host = substr($apikey, strpos($apikey, '-') + 1);
        $auth = base64_encode('user:'.$apikey);
        $data = array('apikey' => $apikey);
        $json = json_encode($data);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://'.$host.'.api.mailchimp.com/3.0/lists');
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Authorization: Basic '.$auth));
        curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-MCAPI/2.0');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        $result = curl_exec($ch);
        if (!$result) {
            $response = '0';
        } else {
            $response = $result;
        }
        print_r($response);exit;
    }

    public function getMailChimpFields()
    {
        $input = JFactory::getApplication()->input;
        $apikey = $input->get('api_key', '', 'string');
        $listId = $input->get('list_id', '', 'string');
        $host = substr($apikey, strpos($apikey, '-') + 1);
        $auth = base64_encode('user:'.$apikey);
        $data = array('apikey' => $apikey);
        $json = json_encode($data);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://'.$host.'.api.mailchimp.com/3.0/lists/'.$listId.'/merge-fields?count=100');
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Authorization: Basic '. $auth));
        curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-MCAPI/2.0');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        $result = curl_exec($ch);
        print_r($result);exit;
    }
}