<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

// import Joomla controllerform library
jimport('joomla.application.component.controllerform');


class BaformsControllerForm extends JControllerForm
{
    public function getModel($name = '', $prefix = '', $config = array('ignore_request' => true))
	{
		return parent::getModel($name, $prefix, array('ignore_request' => false));
	}

    public function loadAjaxForm()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $body = '[forms ID='.$id.']';
        $html = baformsHelper::renderFormHTML($body);
        $design = baformsHelper::$design;
        if (empty($design) || $design->theme->layout != 'lightbox' || $design->lightbox->trigger->type != '') {
            $html = '';
        }
        echo $html;
        exit;
    }

    public function getStripeData()
    {
        $model = $this->getModel();
        $data = $model->getServiceData('stripe');
        $str = json_encode($data);
        echo $str;
        exit();
    }

    public function getCloudPaymentsData()
    {
        $model = $this->getModel();
        $data = $model->getServiceData('cloudpayments');
        $str = json_encode($data);
        echo $str;
        exit();
    }

    public function checkCoupon()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $coupon = $input->get('coupon', '', 'string');
        $model = $this->getModel();
        $data = $model->checkCoupon($id, $coupon);
        echo $data;
        exit();
    }

    public function getRecaptchaData()
    {
        $model = $this->getModel();
        $data = $model->getRecaptchaData();
        echo $data;
        exit();
    }

    public function getFormsLanguage()
    {
        $language = JFactory::getLanguage();
        $language->load('com_baforms', JPATH_ADMINISTRATOR);
        $result = array();
        $path = JPATH_ROOT.'/administrator/components/com_baforms/language/en-GB/en-GB.com_baforms.ini';
        if (JFile::exists($path)) {
            $contents = JFile::read($path);
            $contents = str_replace('_QQ_', '"\""', $contents);
            $data = parse_ini_string($contents);
            foreach ($data as $ind => $value) {
                $result[$ind] = JText::_($ind);
            }
        }
        $formsLanguage = json_encode($result);
        echo $formsLanguage;
        exit;
    }

    public function setAppLicense()
    {
        baformsHelper::setAppLicense('');
        header('Content-Type: text/javascript');
        echo 'var domainResponse = true;';
        exit();
    }

    public function setAppLicenseForm()
    {
        baformsHelper::setAppLicense('');
        header('Location: https://www.balbooa.com/user/downloads/licenses');
        exit();
    }

    public function renderFormsCalendar()
    {
        $input = JFactory::getApplication()->input;
        $year = $input->get('year', '0', 'string');
        $month = $input->get('month', '0', 'string');
        $start = $input->get('start', 0, 'int');
        date_default_timezone_set('UTC');
        $time = mktime(0, 0, 0, $month, 1, $year);
        $obj = $this->renderFormsCalendarData($time, $month, $year, $start);
        $str = json_encode($obj);
        header('Content-Type: text/javascript');
        echo $str;
        exit;
    }

    public static function renderFormsCalendarData($time, $month, $year, $start = 0)
    {
        $end = $start + 6;
        $obj = new stdClass();
        $dateData = new stdClass();
        $dateData->days = array(JText::_('SUN'), JText::_('MON'), JText::_('TUE'), JText::_('WED'), JText::_('THU'),
            JText::_('FRI'), JText::_('SAT'), JText::_('SUN'));
        $today = date('j');
        date_default_timezone_set('UTC');
        $nowDate = new stdClass();
        $nowDate->date = date('n Y');
        $nowDate->year = date('Y');
        $nowDate->month = date('n');
        $nowDate->time = mktime(0, 0, 0, $nowDate->month, 1, $nowDate->year);
        $todayDate = date('n Y', $time);
        $obj->title = JHtml::date($time, 'F Y');
        $obj->header = '';
        for ($i = $start; $i <= $end; $i++) { 
            $obj->header .= '<div class="ba-event-calendar-day-name">'.$dateData->days[$i].'</div>';
        }
        $obj->body = '';
        $firstDay = date('w', mktime(0, 0, 0, $month, 1, $year));
        if ($firstDay == 0 && $start == 1) {
            $firstDay = 7;
        }
        $daysInMonth = date('t', $time);
        $date = 1;
        for ($i = 0; $i < 6; $i++) {
            if ($date > $daysInMonth) {
                break;
            }
            $obj->body .= '<div class="ba-forms-calendar-row">';
            for ($j = $start; $j <= $end; $j++) {
                if (($i === 0 && $j < $firstDay) || $date > $daysInMonth) {
                    $obj->body .= '<div class="ba-empty-date-cell"></div>';
                } else {
                    date_default_timezone_set('UTC');
                    $eventTime = mktime(0, 0, 0, $month, $date, $year);
                    $eventDate = JHtml::date($eventTime, 'j F Y');
                    $dayDate = date('Y-m-d', $eventTime);
                    $obj->body .= '<div class="ba-date-cell'.($date == $today && $nowDate->date == $todayDate ? ' ba-curent-date' : '');
                    $obj->body .= ($nowDate->time > $time || ($nowDate->date == $todayDate && $date < $today) ? ' ba-previous-date' : '');
                    $obj->body .= '" data-date="'.$eventDate.'" data-day-number="'.$j.'" data-day-date="'.$dayDate.'">'.$date.'</div>';
                    $date++;
                }
            }
            $obj->body .= '</div>';
        }

        return $obj;
    }

    public function uploadAttachmentFile()
    {
        $input = JFactory::getApplication()->input;
        $file = $input->files->get('file', array(), 'array');
        $id = $input->post->get('id', 0, 'int');
        $field_id = $input->post->get('field_id', 0, 'int');
        $model = $this->getModel();
        $obj = $model->uploadAttachmentFile($file, $id, $field_id);
        $str = json_encode($obj);
        echo $str;
        exit();
    }

    public function removeTmpAttachment()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $model = $this->getModel();
        $model->removeTmpAttachment($id);
        exit();
    }

    public function sendMessage()
    {
        exit();
    }

    public function message()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->post->get('form-id', 0, 'int');
        $btn = $input->post->get('submit-btn', 0, 'int');
        $honeypot = $input->post->get('ba-honeypot', '', 'string');
        if (!empty($id) && !empty($btn) && empty($honeypot)) {
            $post = $input->post->getArray(array());
            $model = $this->getModel();
            $model->sendMessage($post, $btn, $id);
        }
        exit();
    }

    public function setAppLicenseActivation()
    {
        baformsHelper::setAppLicenseActivation('');
        header('Content-Type: text/javascript');
        echo 'var domainResponse = true;';
        exit();
    }

    public function stripeCharges()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $name = $input->get('name', 0, 'int');
        $str = $input->get('object', '', 'string');
        $object = json_decode($str);
        $model = $this->getModel('form');
        $model->stripeCharges($id, $name, $object);
    }

    public function payAuthorize()
    {
        $input = JFactory::getApplication()->input;
        $total = $input->get('total', 0, 'double');
        $id = $input->get('id', 0, 'int');
        $cardNumber = $input->get('cardNumber', '', 'string');
        $expirationDate = $input->get('expirationDate', '', 'string');
        $cardCode = $input->get('cardCode', '', 'string');
        $cardNumber = str_replace(' ', '', $cardNumber);
        $expArray = explode('/', $expirationDate);
        $expirationDate = $expArray[1].'-'.$expArray[0];
        $model = $this->getModel('form');
        $model->payAuthorize($id, $total, $cardNumber, $expirationDate, $cardCode);
    }

    public function save($key = NULL, $urlVar = NULL)
    {
               
    }
}