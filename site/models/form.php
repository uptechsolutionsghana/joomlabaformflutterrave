<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/ 

defined('_JEXEC') or die;

jimport('joomla.filesystem.file');
jimport('joomla.filesystem.folder');
use Joomla\Registry\Registry;
 
class baformsModelForm extends JModelItem
{
    public $db;
    public $paymentData;
    public $integrationsFields;
    public $pdf;
    public $drivePdf;

    public function getServiceData($service)
    {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('*')
            ->from('#__baforms_api')
            ->where('service = '.$db->quote($service));
        $db->setQuery($query);
        $data = $db->loadObject();
        $service = json_decode($data->key);
        if (!$service) {
            $service = $data->key;
        }

        return $service;
    }

    public function checkCoupon($id, $coupon)
    {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('*')
            ->from('#__baforms_items')
            ->where('id = '.$id);
        $db->setQuery($query);
        $item = $db->loadObject();
        $options = json_decode($item->options);
        $response = '';
        $expired = !empty($options->promo->expires) ? strtotime('now') > strtotime($options->promo->expires) : false;
        $expires = strtotime($options->promo->expires);
        $now = strtotime('now');
        if ($options->promo->enable && $options->promo->code == $coupon && !$expired) {
            $response = json_encode($options->promo);
        }

        return $response;
    }

    public function getRecaptchaData()
    {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('params, enabled, element')
            ->from('#__extensions')
            ->where('element = '.$db->quote('recaptcha').' OR element = '.$db->quote('recaptcha_invisible'))
            ->where('folder = '.$db->quote('captcha'))
            ->where('type = '.$db->quote('plugin'));
        $db->setQuery($query);
        $list = $db->loadObjectList();
        $data = new stdClass();
        $data->data = new stdClass();
        foreach ($list as $value) {
            if ($value->enabled == 1) {
                $obj = new Registry();
                $obj->loadString($value->params);
                $object = new stdClass();
                $object->public_key = $obj->get('public_key', '');
                $object->private_key = $obj->get('private_key', '');
                $object->theme = $obj->get('theme2', '');
                $object->size = $obj->get('size', '');
                $object->badge = $obj->get('badge', '');
            } else {
                $object = null;
            }
            $data->{$value->element} = $object;
        }
        $str = json_encode($data);

        return $str;
    }

    public function replace($str)
    {
        $str = mb_strtolower($str, 'utf-8');
        $search = array('?', '!', '.', ',', ':', ';', '*', '(', ')', '{', '}', '***91;',
            '***93;', '%', '#', '№', '@', '$', '^', '-', '+', '/', '\\', '=',
            '|', '"', '\'', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'з', 'и', 'й',
            'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ъ',
            'ы', 'э', ' ', 'ж', 'ц', 'ч', 'ш', 'щ', 'ь', 'ю', 'я');
        $replace = array('-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
            '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
            'a', 'b', 'v', 'g', 'd', 'e', 'e', 'z', 'i', 'y', 'k', 'l', 'm', 'n',
            'o', 'p', 'r', 's', 't', 'u', 'f', 'h', 'j', 'i', 'e', '-', 'zh', 'ts',
            'ch', 'sh', 'shch', '', 'yu', 'ya');
        $str = str_replace($search, $replace, $str);
        $str = trim($str);
        $str = preg_replace("/_{2,}/", "-", $str);

        return $str;
    }

    public function uploadAttachmentFile($file, $id, $field_id)
    {
        $obj = new stdClass();
        if (isset($file['error']) && $file['error'] == 0) {
            $ext = strtolower(JFile::getExt($file['name']));
            $dir = JPATH_ROOT.'/'.UPLOADS_STORAGE;
            if (UPLOADS_STORAGE == 'images/baforms/uploads' && !JFolder::exists($dir)) {
                JFolder::create(JPATH_ROOT.'/images/baforms');
                JFolder::create($dir);
            }
            if (!JFolder::exists($dir)) {
                return $obj;
            }
            $dir .= '/form-'.$id.'/';
            if (!JFolder::exists($dir)) {
                JFolder::create($dir);
            }
            $name = str_replace('.'.$ext, '', $file['name']);
            $fileName = $this->replace($name);
            $fileName = JFile::makeSafe($fileName);
            $name = str_replace('-', '', $fileName);
            $name = str_replace('.', '', $name);
            if ($name == '') {
                $fileName = date("Y-m-d-H-i-s").'.'.$ext;
            }
            $i = 2;
            $name = $fileName;
            while (JFile::exists($dir.$name.'.'.$ext)) {
                $name = $fileName.'-'.($i++);
            }
            $fileName = $name.'.'.$ext;
            JFile::upload($file['tmp_name'], $dir.$fileName);
            $obj = $this->addAttachmentFile($file['name'], $fileName, $id, $field_id);
        }

        return $obj;
    }

    public function addAttachmentFile($name, $filename, $id, $field_id)
    {
        $db = JFactory::getDbo();
        $obj = new stdClass();
        $obj->submission_id = 0;
        $obj->form_id = $id;
        $obj->field_id = $field_id;
        $obj->name = $name;
        $obj->filename = $filename;
        $obj->date = date("Y-m-d-H-i-s");
        $db->insertObject('#__baforms_submissions_attachments', $obj);
        $obj->id = $db->insertid();

        return $obj;
    }

    public function removeTmpAttachment($id)
    {
        if (!empty($id)) {
            $db = JFactory::getDbo();
            $query = $db->getQuery(true)
                ->select('*')
                ->from('#__baforms_submissions_attachments')
                ->where('id = '.$id);
            $db->setQuery($query);
            $obj = $db->loadObject();
            $dir = JPATH_ROOT.'/'.UPLOADS_STORAGE.'/form-'.$obj->form_id.'/';
            $file = $dir.$obj->filename;
            if (JFile::exists($file)) {
                JFile::delete($file);
            }
            $query = $db->getQuery(true)
                ->delete('#__baforms_submissions_attachments')
                ->where('id = '.$id);
            $db->setQuery($query)
                ->execute();
        }
    }

    public function updateShortcodes($data, $fields)
    {
        baformsHelper::$shortCodes->{'[Page Title]'} = $data['page-title'];
        baformsHelper::$shortCodes->{'[Page URL]'} = $data['page-url'];
        baformsHelper::$shortCodes->{'[Page ID]'} = $data['page-id'];
        $allFields = '';
        foreach ($fields as $key => $field) {
            preg_match('/\d+/', $key, $match);
            if ($field->type == 'total') {
                $object = json_decode($field->value);
                include JPATH_ROOT.'/components/com_baforms/views/form/tmpl/submission/total-email-pattern.php';
                baformsHelper::$shortCodes->{'[Field ID='.$match[0].']'} = $out;
                $allFields .= $out;
                $field->value = $object->resultTotal;
            } else {
                $value = str_replace('<br>', '', $field->value);
                baformsHelper::$shortCodes->{'[Field ID='.$match[0].']'} = $value;
                include JPATH_ROOT.'/components/com_baforms/views/form/tmpl/submission/field-email-pattern.php';
                $allFields .= $out;
            }
        }
        baformsHelper::$shortCodes->{'[All Fields]'} = $allFields;
    }

    public function preparePaymentData($id, $userEmail, $object, $field)
    {
        $str = json_encode($object);
        $object = json_decode($str);
        $this->paymentData = new stdClass();
        $this->paymentData->id = $id;
        $this->paymentData->userEmail = $userEmail;
        $this->paymentData->total = $object->total;
        $this->paymentData->products = array();
        $this->paymentData->title = $field->options->title;
        $this->paymentData->decimals = $field->options->decimals;
        $this->paymentData->position = $field->options->position;
        $this->paymentData->separator = $field->options->separator;
        $this->paymentData->symbol = $field->options->symbol;
        $this->paymentData->code = $field->options->code;
        $this->paymentData->thousand = $field->options->thousand;
        $tax = 0;
        if ($field->options->tax->enable) {
            $tax = $field->options->tax->value * 1;
            $this->paymentData->total = $this->paymentData->total * 1 + $this->paymentData->total * $tax / 100;
        }
        foreach ($object->products as $products) {
            foreach ($products as $product) {
                $product->price = $product->price * 1 + $product->price * $tax / 100;
                $product->total = $product->price * $product->quantity;
                $this->paymentData->products[] = $product;
            }
        }
        if (isset($object->promo) && $field->options->promo->enable && $object->promo == $field->options->promo->code) {
            $discount = $field->options->promo->discount * 1;
            if ($field->options->promo->unit == '%') {
                $discount = $this->paymentData->total * $discount / 100;
            }
            $this->paymentData->discount = $discount;
            $this->paymentData->total = $this->paymentData->total - $discount;
        }
        if (isset($object->shipping)) {
            $this->paymentData->shipping = $object->shipping;
            $product = new stdClass();
            $product->quantity = 1;
            $product->title = $object->shipping->title;
            $product->price = $object->shipping->price;
            $product->total = $product->price;
            $this->paymentData->products[] = $product;
            $this->paymentData->total = $this->paymentData->total + $this->paymentData->shipping->price;
        }
    }

    public function executePHP($code)
    {
        try {
            eval($code);
        } catch (Throwable $t) {
            
        }
    }

    public function sendMessage($data, $btn, $id)
    {
        baformshelper::prepareHelper();
        $this->db = JFactory::getDbo();
        $this->integrationsFields = new stdClass();
        JFactory::getLanguage()->load('com_baforms', JPATH_ADMINISTRATOR);
        $submit = $this->getFormField($btn, $id);
        baformsHelper::getFormShortCodes($id);
        $userEmail = '';
        $fields = new stdClass();
        $attachmentFiles = array();
        $files = array();
        $filesURL = array();
        $messageArray = array();
        foreach ($data as $key => $value) {
            if (is_numeric($key)) {
                $field = $this->getFormField($key * 1, $id);
                if ($field->type == 'input' && $field->options->type == 'email') {
                    $userEmail = $value;
                }
                $this->integrationsFields->{str_replace('baform-', '', $field->key)} = $value;
                $fields->{$field->key} = new stdClass();
                $fields->{$field->key}->value = '';
                $fields->{$field->key}->title = $field->options->title;
                $fields->{$field->key}->type = $field->type;
                if (empty($fields->{$field->key}->title) && isset($field->options->placeholder)) {
                    $fields->{$field->key}->title = $field->options->placeholder;
                }
                $message = '';
                $rating = array('VERY_UNSATISFIED', 'UNSATISFIED', 'NEUTRAL', 'SATISFIED', 'VERY_SATISFIED');
                switch ($field->type) {
                    case 'checkbox':
                    case 'selectMultiple':
                        foreach ($value as $text) {
                            $fields->{$field->key}->value .= $text.';<br>';
                        }
                        break;
                    case 'upload':
                        $filesData = json_decode($value);
                        foreach ($filesData as $file) {
                            $attachmentFiles[] = $file->id;
                            $filePath = UPLOADS_STORAGE.'/form-'.$id.'/'.$file->filename;
                            $fileURL = JUri::root().$filePath;
                            $files[] = JPATH_ROOT.'/'.$filePath;
                            $filesURL[] = $fileURL;
                            $fields->{$field->key}->value .= '<a href="'.$fileURL.'">'.$file->name.'</a>;<br>';
                        }
                        break;
                    case 'calculation':
                        $thousand = $field->options->thousand;
                        $separator = $field->options->separator;
                        $decimals = $field->options->decimals;
                        $price = baformsHelper::renderPrice($value, $thousand, $separator, $decimals);
                        if (empty($field->options->position)) {
                            $price = $field->options->symbol.' '.$price;
                        } else {
                            $price .= ' '.$field->options->symbol;
                        }
                        $fields->{$field->key}->value = $price;
                        break;
                    case 'slider':
                        $fields->{$field->key}->value = str_replace(' ', ' - ', $value);
                        break;
                    case 'phone':
                        $fields->{$field->key}->value = '<a href="tel:'.$value.'">'.$value.'</a>';
                        break;
                    case 'rating':
                        $fields->{$field->key}->value = JText::_($rating[$value * 1 - 1]);
                        break;
                    default:
                        $fields->{$field->key}->value = $value;
                        break;
                }
                if ($field->type == 'total') {
                    $fields->{$field->key}->options = $field->options;
                    $object = json_decode($fields->{$field->key}->value);
                    $object->options = $field->options;
                    $fields->{$field->key}->object = $object;
                    $message = json_encode($object);
                    $this->preparePaymentData($id, $userEmail, $object, $field);
                    if (isset($data['payment_id'])) {
                        $messageArray[] = 'Payment Id|-_-|'.$data['payment_id'].'|-_-|input';
                    } else if (isset($data['transId'])) {
                        $messageArray[] = 'Transaction Id|-_-|'.$data['transId'].'|-_-|input';
                    } else if (isset($data['invoiceId'])) {
                        $messageArray[] = 'Invoice Id|-_-|'.$data['invoiceId'].'|-_-|input';
                    }
                    $messageArray[] = $fields->{$field->key}->title.'|-_-|'.$message.'|-_-|'.$field->type;
                    $thousand = $field->options->thousand;
                    $separator = $field->options->separator;
                    $decimals = $field->options->decimals;
                    $price = baformsHelper::renderPrice((string)$this->paymentData->total, $thousand, $separator, $decimals);
                    if (empty($field->options->position)) {
                        $price = $field->options->symbol.' '.$price;
                    } else {
                        $price .= ' '.$field->options->symbol;
                    }
                    $this->integrationsFields->{str_replace('baform-', '', $field->key)} = $price;
                } else if ($field->type != 'upload') {
                    $messageArray[] = $fields->{$field->key}->title.'|-_-|'.$fields->{$field->key}->value.'|-_-|'.$field->type;
                    $this->integrationsFields->{str_replace('baform-', '', $field->key)} = strip_tags($fields->{$field->key}->value);
                }
            }
        }
        $this->updateShortcodes($data, $fields);
        if ($submit->options->database) {
            $submission = new stdClass();
            $submission->title = baformsHelper::$shortCodes->{'[Form Title]'};
            $submission->message = implode('_-_', $messageArray);
            $submission->date_time = date("Y-m-d H:i:s");
            $this->db->insertObject('#__baforms_submissions', $submission);
            $submissionId = $this->db->insertid();
            baformsHelper::$shortCodes->{'[Submission ID]'} = $submissionId;
            if (!empty($attachmentFiles)) {
                $attachmentStr = implode(', ', $attachmentFiles);
                $query = $this->db->getQuery(true)
                    ->update('#__baforms_submissions_attachments')
                    ->set('submission_id = '.$submissionId)
                    ->where('id IN ('.$attachmentStr.')');
                $this->db->setQuery($query)
                    ->execute();
            }
        }
        if (!empty($submit->options->php)) {
            $code = baformsHelper::renderDefaultValue($submit->options->php);
            $this->executePHP($code);
        }
        if (baformsHelper::$about->tag == 'pro' && isset(baformsHelper::$state->data)) {
            $this->checkIntegration($id, $fields, $files);
        }
        if ($submit->options->notifications->enable) {
            $mailer = JFactory::getMailer();
            $config = JFactory::getConfig();
            $recipients = array();
            $sender = array($config->get('mailfrom'), $config->get('fromname'));
            foreach ($submit->options->notifications->admin as $email => $value) {
                $recipients[] = $email;
            }
            if (empty($recipients)) {
                $recipients[] = $config->get('mailfrom');
            }
            if (!empty($userEmail)) {
                $mailer->addReplyTo($userEmail);
            }
            if (!empty($submit->options->notifications->email) && !empty($userEmail)) {
                $sender = array($userEmail, '');
            }
            if (!empty($files) && $submit->options->notifications->attach) {
                $mailer->addAttachment($files);
            }
            if ($submit->options->notifications->attach_pdf && !empty($this->pdf)) {
                $mailer->addAttachment($this->pdf);
            }
            $subject = baformsHelper::renderDefaultValue($submit->options->notifications->subject);
            $body = baformsHelper::renderDefaultValue($submit->options->notifications->body);
            $mailer->isHTML(true);
            $mailer->Encoding = 'base64';
            $mailer->setSender($sender);
            $mailer->setSubject($subject);
            $mailer->addRecipient($recipients);
            $mailer->setBody($body);
            $mailer->Send();
        }
        if ($submit->options->reply->enable && !empty($userEmail)) {
            $mailer = JFactory::getMailer();
            $config = JFactory::getConfig();
            $recipients = array($userEmail);
            $sender = array($config->get('mailfrom'), $config->get('fromname'));
            if (!empty($files) && $submit->options->reply->attach) {
                $mailer->addAttachment($files);
            }
            if ($submit->options->reply->attach_pdf && !empty($this->pdf)) {
                $mailer->addAttachment($this->pdf);
            }
            $subject = baformsHelper::renderDefaultValue($submit->options->reply->subject);
            $body = baformsHelper::renderDefaultValue($submit->options->reply->body);
            $mailer->isHTML(true);
            $mailer->Encoding = 'base64';
            $mailer->setSender($sender);
            $mailer->setSubject($subject);
            $mailer->addRecipient($recipients);
            $mailer->setBody($body);
            $mailer->Send();
        }
        if ($submit->options->onclick == 'payment' && (baformsHelper::$about->tag == 'pro' && isset(baformsHelper::$state->data))) {
            $this->executePayment($submit);
        } else if ($submit->options->onclick == 'redirect') {
            $link = baformsHelper::renderDefaultValue($submit->options->link);
            echo $link;
        }
    }

    public function checkIntegration($id, $fields, $files)
    {
        $query = $this->db->getQuery(true)
            ->select('acym_fields_map, telegram_token, mailchimp_fields_map, mailchimp_list_id,
                google_sheets, activecampaign_fields, pdf_submissions, campaign_monitor_fields,
                getresponse_fields, zoho_crm_fields, google_drive')
            ->from('#__baforms_forms')
            ->where('id = '.$id);
        $this->db->setQuery($query);
        $object = $this->db->loadObject();
        $mailchimp = $this->getServiceData('mailchimp');
        if (!empty($mailchimp)) {
            $mailchimp_fields = json_decode($object->mailchimp_fields_map);
            $this->addMailchimpSubscribe($mailchimp, $object->mailchimp_list_id, $mailchimp_fields);
        }
        $campaign_monitor = $this->getServiceData('campaign_monitor');
        $this->addCampaignMonitorSubscribe($campaign_monitor, $object->campaign_monitor_fields);
        $getresponse = $this->getServiceData('getresponse');
        $this->addGetResponseSubscribe($getresponse, $object->getresponse_fields);
        $activecampaign = $this->getServiceData('activecampaign');
        $this->addActivecampaignContact($activecampaign, $object->activecampaign_fields);
        if (!empty($object->acym_fields_map)) {
            $acymailing = json_decode($object->acym_fields_map);
            $this->addAcymailingSubscriber($acymailing);
        }
        if (!empty($object->telegram_token)) {
            $this->telegramAction($object->telegram_token, $fields, $files);
        }
        if (!empty($object->google_sheets)) {
            $this->addGoogleSheets($object->google_sheets);
        }
        $google_drive = $this->getServiceData('google_drive');
        if (!empty($object->google_drive)) {
            $obj = json_decode($object->google_drive);
            foreach ($obj as $ind => $value) {
                $google_drive->{$ind} = $value;
            }
        }
        if (empty($object->pdf_submissions)) {
            $object->pdf_submissions = '{"enable":"false","title":false,"empty":false,"size":"A4","orientation":"Portrait"}';
        }
        $this->createPdf($fields, $object->pdf_submissions, $google_drive);
        $this->googleDriveIntegration($google_drive, $files);
        $zoho_crm = $this->getServiceData('zoho_crm');
        if (!empty($zoho_crm->client_id) && !empty($zoho_crm->client_secret) && !empty($zoho_crm->host) && !empty($zoho_crm->grant_token)) {
            $zoho_crm_fields = json_decode($object->zoho_crm_fields);
            $this->addZohoCRMContact($zoho_crm, $zoho_crm_fields);
        }
    }

    public function googleDriveIntegration($obj, $files)
    {
        $path = JPATH_ROOT.'/components/com_baforms/libraries/google-drive/drive.php';
        if (empty($obj->accessToken) || empty($obj->folder) || !($obj->pdf || $obj->files) || !JFile::exists($path)) {
            return;
        }
        include $path;
        $drive = new drive();
        $data = array();
        if ($obj->files) {
            foreach ($files as $file) {
                $object = new stdClass();
                $object->name = JFile::getName($file);
                $object->path = $file;
                $data[] = $object;
            }
        }
        if ($obj->pdf) {
            $pdf = !empty($this->pdf) ? $this->pdf : $this->drivePdf;
            $object = new stdClass();
            $object->name = JFile::getName($pdf);
            $object->path = $pdf;
            $data[] = $object;
        }
        $drive->uploadFiles($obj->accessToken, $data, $obj->folder);
    }

    public function createPdf($fields, $settings, $google_drive)
    {
        $obj = json_decode($settings);
        $drive = !empty($google_drive->accessToken) && !empty($google_drive->folder) && $google_drive->pdf;
        $path = JPATH_ROOT.'/components/com_baforms/libraries/pdf-submissions/pdf.php';
        if (!($obj->enable || $drive) || !JFile::exists($path)) {
            return;
        }
        include $path;
        $pdf = new pdf($fields, $obj);
        $fileName = $this->replace(baformsHelper::$shortCodes->{'[Form Title]'});
        $file = $pdf->create($fileName);
        if ($obj->enable) {
            $this->pdf = $file;
        } else if ($drive) {
            $this->drivePdf = $file;
        }
    }

    public function addZohoCRMContact($zoho_crm, $zoho_crm_fields)
    {
        $dir = JPATH_ROOT.'/components/com_baforms/libraries/zoho-crm/zoho.php';
        if (JFile::exists($dir) && !empty($zoho_crm_fields->layout_id)) {
            $layout_id = $zoho_crm_fields->layout_id;
            unset($zoho_crm_fields->layout_id);
            require_once $dir;
            $data = $this->getServiceData('zoho_temp');
            $fields = new stdClass();
            foreach ($zoho_crm_fields as $key => $value) {
                if (empty($value) || !isset($this->integrationsFields->{$value})) {
                    continue;
                }
                $fields->{$key} = $this->integrationsFields->{$value};
            }
            try {
                $zoho = new zoho($data);
                $zoho->addContact($layout_id, $fields);
            } catch (Exception $e) {

            }
        }
    }

    public function addGoogleSheets($google_sheets)
    {
        $obj = $this->getServiceData('google_sheets');
        $dir = JPATH_ROOT.'/components/com_baforms/libraries/google-sheets/baSheets.php';
        if (!empty($obj->code) && JFile::exists($dir)) {
            $sheets = json_decode($google_sheets);
            if (!empty($sheets->spreadsheet) && !empty($sheets->worksheet)) {
                $row = array();
                foreach ($sheets->columns as $key => $value) {
                    if (empty($value) || !isset($this->integrationsFields->{$value})) {
                        continue;
                    }
                    $str = $this->integrationsFields->{$value};
                    $patern = array('~', '`', '!', '@', '"', '#', '№', '$', ';', '%', '^', '&', '?',
                        '*', '(', ')', '+', '=', '/', '|', '.', "'", ',', '\\', ' ', '€');
                    $key = strtolower(str_replace($patern, '', $key));
                    $row[$key] = $str;
                }
                if (!empty($row)) {
                    require_once $dir;
                    $baSheets = new baSheets();
                    $baSheets->insert($obj->accessToken, $row, $sheets->spreadsheet, $sheets->worksheet);
                }
            }
        }
    }

    public function addActivecampaignContact($obj, $activecampaign_fields)
    {
        $fields = json_decode($activecampaign_fields);
        if (!empty($obj->api_key) && !empty($obj->account) && !empty($fields->list) && !empty($fields->email)
            && isset($this->integrationsFields->{$fields->email})) {
            require_once JPATH_ROOT.'/components/com_baforms/libraries/activecampaign/activecampaign.php';
            $activecampaign = new activecampaign($obj->account, $obj->api_key);
            $contact = new stdClass();
            foreach ($fields as $key => $field) {
                if ($key == 'list') {
                    continue;
                } else if (!empty($field) && isset($this->integrationsFields->{$field})) {
                    $contact->{$key} = $this->integrationsFields->{$field};
                }
            }
            $activecampaign->addContact($contact, $fields->list);
        }
    }

    public function addGetResponseSubscribe($obj, $getresponse_fields)
    {
        $fields = json_decode($getresponse_fields);
        if (!empty($obj->api_key) && !empty($fields->email) && isset($this->integrationsFields->{$fields->email})
            && !empty($fields->name) && isset($this->integrationsFields->{$fields->name})) {
            require_once JPATH_ROOT.'/components/com_baforms/libraries/getresponse/getresponse.php';
            $getresponse = new getresponse($obj->api_key, $fields->list_id);
            $custom = array();
            if ($obj->custom_fields) {
                foreach ($fields as $key => $field) {
                    if ($key == 'name' || $key == 'email' || $key == 'list_id' || !isset($this->integrationsFields->{$field})) {
                        continue;
                    }
                    $custom[] = array(
                        'customFieldId' => $key,
                        'value' => array($this->integrationsFields->{$field})
                    );
                }
            }
            $getresponse->addSubscriber($this->integrationsFields->{$fields->name}, $this->integrationsFields->{$fields->email}, $custom);
        }
    }

    public function addCampaignMonitorSubscribe($obj, $campaign_monitor_fields)
    {
        $fields = json_decode($campaign_monitor_fields);
        $dir = JPATH_ROOT.'/components/com_baforms/libraries/campaign-monitor/campaign.php';
        if (JFile::exists($dir) && !empty($obj->api_key) && !empty($obj->client_id)
            && !empty($fields->EmailAddress) && isset($this->integrationsFields->{$fields->EmailAddress})
            && !empty($fields->Name) && isset($this->integrationsFields->{$fields->Name})) {
            require_once $dir;
            $campaign = new campaign($obj->api_key, $obj->client_id, $fields->list_id);
            $custom = array();
            foreach ($fields as $key => $field) {
                if ($key == 'Name' || $key == 'EmailAddress' || $key == 'list_id' || !isset($this->integrationsFields->{$field})) {
                    continue;
                }
                $custom[] = array(
                    'Key' => $key,
                    'Value' => $this->integrationsFields->{$field}
                );
            }
            $campaign->addSubscriber($this->integrationsFields->{$fields->Name}, $this->integrationsFields->{$fields->EmailAddress}, $custom);
        }
    }
    public function addMailchimpSubscribe($api_key, $listid, $fields)
    {
        if (!empty($listid) && !empty($fields->EMAIL) && isset($this->integrationsFields->{$fields->EMAIL})) {
            $email = $this->integrationsFields->{$fields->EMAIL};
            $memberId = md5(strtolower($email));
            $dataCenter = substr($api_key,strpos($api_key,'-') + 1);
            $url = 'https://'.$dataCenter.'.api.mailchimp.com/3.0/lists/'.$listid.'/members/'.$memberId;
            $merge_fields = array();
            foreach ($fields as $key => $value) {
                if ($key != 'EMAIL' && isset($this->integrationsFields->{$value})) {
                    $merge_fields[$key] = $this->integrationsFields->{$value};
                }
            }
            $array = array('email_address' => $email, 'status' => 'subscribed');
            if (!empty($merge_fields)) {
                $array['merge_fields'] = $merge_fields;
            }
            $json = json_encode($array);
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_USERPWD, 'user:'.$api_key);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_TIMEOUT, 10);
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $json);
            curl_exec($curl);
            curl_close($curl);
        }
    }

    public function getContentsCurl($url)
    {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        $data = curl_exec($curl);
        curl_close($curl);

        return $data;
    }

    public function checkTelegramExt($file)
    {
        switch (JFile::getExt($file)) {
            case 'jpg':
            case 'png':
            case 'gif':
            case 'jpeg':
                return array('sendPhoto', 'photo');
            case 'mp3':
                return array('sendAudio', 'audio');
            case 'mp4':
                return array('sendVideo', 'video');
            default:
                return array('sendDocument', 'document');
        }
    }

    public function telegramAction($token, $fields, $files)
    {
        $message = '';
        if (function_exists('curl_init')) {
            $url = 'https://api.telegram.org/bot'.$token;
            $data = $this->getContentsCurl($url.'/getUpdates');
            $data = json_decode($data);
            if (!empty($data->result)) {
                $chats = array();
                foreach ($fields as $field) {
                    if ($field->type != 'upload') {
                        $text = str_replace('<br>', '', $field->value);
                        $text = str_replace('<br/>', '', $text);
                        $message .= '<b>'.$field->title. '</b> : '.$text.'';
                        $message .= '                                                                                        ';
                    }
                }
                foreach ($data->result as $key => $value) {
                    $result = $value;
                    $chat_id = $result->message->chat->id;
                    if (!in_array($chat_id, $chats)) {
                        $chats[] = $chat_id;
                        $uri = $url.'/sendMessage?chat_id='.$chat_id.'&parse_mode=HTML&text='.$message;
                        $this->getContentsCurl($uri);
                        foreach ($files as $file) {
                            $method = $this->checkTelegramExt($file);
                            $uri = $url.'/'.$method[0].'?chat_id='.$chat_id.'&'.$method[1].'='.$file;
                            $this->getContentsCurl($uri);
                        }
                    }
                }
            }
        }
    }

    public function addAcymailingSubscriber($acymailing)
    {
        $checkAcymailing = $this->checkAcymailing();
        if (!empty($checkAcymailing)) {
            if (!empty($acymailing->name) && !empty($acymailing->email)) {
                $app = JFactory::getApplication();
                $created = date('Y-m-d H:i:s');
                $obj = new stdClass();
                if (isset($this->integrationsFields->{$acymailing->name}) && isset($this->integrationsFields->{$acymailing->email})) {
                    $obj->name = $this->integrationsFields->{$acymailing->name};
                    $obj->email = $this->integrationsFields->{$acymailing->email};
                    $checkAcymailingEmail = $this->checkAcymailingEmail($obj->email);
                    if (!empty($checkAcymailingEmail)) {
                        return;
                    }
                    $obj->creation_date = $created;
                    $obj->confirmed = $obj->active = 1;
                    $this->db->insertObject('#__acym_user', $obj);
                    $id = $this->db->insertid();
                    if (!empty($acymailing->list)) {
                        $obj = new stdClass();
                        $obj->list_id = $acymailing->list;
                        $obj->user_id = $id;
                        $obj->subscription_date = $created;
                        $obj->status = 1;
                        $this->db->insertObject('#__acym_user_has_list', $obj);
                    }
                    foreach ($acymailing as $key => $value) {
                        if ($key == 'email' || $key == 'name' || !isset($this->integrationsFields->{$value})) {
                            continue;
                        }
                        $obj = new stdClass();
                        $obj->field_id = $key;
                        $obj->user_id = $id;
                        $obj->value = $this->integrationsFields->{$value};
                        $this->db->insertObject('#__acym_user_has_field', $obj);
                    }
                }
            }
        }
    }

    public function checkAcymailingEmail($email)
    {
        $query = $this->db->getQuery(true)
            ->select('id')
            ->from('#__acym_user')
            ->where('email = '.$this->db->quote($this->db->escape($email, true)));
        $this->db->setQuery($query);
        $id = $this->db->loadResult();

        return $id;
    }

    public function checkAcymailing()
    {
        $query = $this->db->getQuery(true)
            ->select('extension_id')
            ->from('#__extensions')
            ->where('element = '.$this->db->quote('com_acym'));
        $this->db->setQuery($query);
        $id = $this->db->loadResult();

        return $id;
    }

    public function executeCustomPayment($className)
    {
        print_r($this->paymentData);exit;
        $file = JPATH_ROOT.'/components/com_baforms/libraries/custom-payment-gateway/custom-payment-gateway.xml';
        if (function_exists('simplexml_load_string') && JFile::exists($file)) {
            $str = JFile::read($file);
            $xml = simplexml_load_string($str);
            foreach ($xml->payment as $payment) {
                $obj = new stdClass();
                foreach ($payment as $key => $value) {
                    $obj->{(string)$key} = trim((string)$value);
                }
                if ($obj->class == $className) {
                    include JPATH_ROOT.'/'.$obj->path;
                    call_user_func(array($obj->class, 'executePayment'), $this->paymentData);
                    break;
                }
            }
        }
    }

    public function executePayment($submit)
    {
        if (strpos($submit->options->payment, 'custom-payment-') !== false) {
            $key = str_replace('custom-payment-', '', $submit->options->payment);
            $this->executeCustomPayment($key);            
        } else {
            switch ($submit->options->payment) {
                case 'paypal':
                    $this->paypal();
                    break;
                case 'twocheckout':
                    $this->twocheckout();
                    break;
                case 'liqpay':
                    $this->liqpay();
                    break;
                case 'payupl':
                    $this->payupl();
                    break;
                case 'robokassa':
                    $this->robokassa();
                    break;
                case 'flutterwave':
                    $this->flutterwave();
                    break;
                case 'mollie':
                    $this->mollie();
                    break;
            }
        }
    }

    public function getFormField($id, $form_id)
    {
        $query = $this->db->getQuery(true)
            ->select('*')
            ->from('#__baforms_items')
            ->where('id = '.$id)
            ->where('form_id = '.$form_id);
        $this->db->setQuery($query);
        $item = $this->db->loadObject();
        $item->options = json_decode($item->options);

        return $item;
    }

    public function mollie()
    {
        $mollie = $this->getServiceData('mollie');
        $price = baformsHelper::renderPrice((string)$this->paymentData->total, '', '.', '2');
        $title = array();
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        $name = implode(', ', $title);
        $array = array(
            "amount" => array("currency" => $this->paymentData->code, "value" => $price),
            "description" => $name,
            "redirectUrl" => $mollie->return_url,
            "metadata" => array("order_id" => time())
        );
        $headers = array('Authorization: Bearer '.$mollie->api_key, 'Content-Type: application/json');
        $curl = curl_init();
        $options = array();
        $options[CURLOPT_POST] = 1;
        $options[CURLOPT_POSTFIELDS] = json_encode($array);
        $options[CURLOPT_URL] = 'https://api.mollie.com/v2/payments';
        $options[CURLOPT_CONNECTTIMEOUT] = 30;
        $options[CURLOPT_TIMEOUT] = 80;
        $options[CURLOPT_RETURNTRANSFER] = true;
        $options[CURLOPT_HTTPHEADER] = $headers;
        $options[CURLOPT_SSL_VERIFYPEER] = false;
        curl_setopt_array($curl, $options);
        $body = curl_exec($curl);
        $response = json_decode($body);
        if (isset($response->_links) && isset($response->_links->checkout)) {
            header('Location: '.$response->_links->checkout->href, true, 303);
        } else {
            header('Location: '.$mollie->return_url);
        }
    }

    public function robokassa()
    {
        $robokassa = $this->getServiceData('robokassa');
        $title = array();
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        $name = implode(', ', $title);
        $inv_id = time();
        $signature = md5($robokassa->shop_id.":".$this->paymentData->total.":".$inv_id.":".$this->paymentData->code.":".$robokassa->password);
?>
        <form action="https://auth.robokassa.ru/Merchant/Index.aspx" method="POST" id="payment-form">
            <input type=hidden name=MerchantLogin value="<?php echo $robokassa->shop_id; ?>">
            <input type=hidden name=OutSum value="<?php echo $this->paymentData->total; ?>">
            <input type=hidden name=InvId value="<?php echo $inv_id; ?>">
            <input type=hidden name=Description value="<?php echo $name; ?>">
            <input type=hidden name=SignatureValue value="<?php echo $signature; ?>">
            <input type=hidden name=OutSumCurrency value="<?php echo $this->paymentData->code; ?>">
        </form>
        <script type="text/javascript">
            document.getElementById('payment-form').submit();
        </script>
<?php
    }

    public function payupl()
    {
        $payupl = $this->getServiceData('payupl');
        $title = array();
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        $name = implode(', ', $title);
        if ($payupl->environment == 'sandbox') {
            $url = 'https://secure.snd.payu.com/api/v2_1/orders';
        } else {
            $url = 'https://secure.payu.com/api/v2_1/orders';
        }
        $price = baformsHelper::renderPrice((string)$this->paymentData->total, '', '.', '2');
        $fields = array("customerIp" => $_SERVER['REMOTE_ADDR'], "merchantPosId" => $payupl->pos_id,
            "description" => $name, "totalAmount" => $price * 100, "currencyCode" => $this->paymentData->code,
            "notifyUrl" => $payupl->return_url, "continueUrl" => $payupl->return_url);
        $fields['products[0].name'] = $name;
        $fields['products[0].unitPrice'] = $price * 100;
        $fields['products[0].quantity'] = 1;
        ksort($fields);
        $str = '';
        foreach ($fields as $value) {
            $str .= $value;
        }
        $str .= $payupl->second_key;
        $hash = hash('md5', $str);
        $signature = 'sender='.$payupl->pos_id.';algorithm=MD5;signature='.$hash;
        ?>
        <form id="payment-form" action="<?php echo $url; ?>" method="post">
<?php
        foreach ($fields as $key => $value) {
?>
            <input type="hidden" name="<?php echo $key; ?>" value="<?php echo $value; ?>">
<?php
        }
?>
            <input type="hidden" name="OpenPayu-Signature" value="<?php echo $signature; ?>">
        </form>
        <script type="text/javascript">
            document.getElementById('payment-form').submit();
        </script>
<?php
        exit;
    }

    public function liqpay()
    {
        $liqpay = $this->getServiceData('liqpay');
        $title = array();
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        include JPATH_ROOT.'/components/com_baforms/libraries/liqpay/LiqPay.php';
        $LiqPay = new LiqPay($liqpay->public_key, $liqpay->private_key);
        $html = $LiqPay->cnb_form(array(
            'action' => 'pay',
            'amount' => $this->paymentData->total,
            'currency' => $this->paymentData->code,
            'description' => implode(', ', $title),
            'order_id' => time(),
            'version' => '3',
            'result_url' => $liqpay->return_url
        ));
        echo $html;exit;
    }
    
    public function flutterwave(){
        $flutterwave = $this->getServiceData('flutterwave');
        // print_r($flutterwave);
        $title = array();
        // print_r($this->paymentData);
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        include JPATH_ROOT.'/components/com_baforms/libraries/flutterwave/Flutterwave.php';
        $Flutterwave = new Flutterwave($flutterwave->api_key, $flutterwave->secret_key, $flutterwave->encryption, $flutterwave->environment);
        $Flutterwave->set_payload([
            'currency'=> 'GHS',
            'country'=> 'GH',
            'payment_type'=> 'account',
            'amount'=> 50,
            'email'=> 'kwartengsimms@gmail.com',
            'network'=> 'MTN',
            'phonenumber'=> '0547659525',
            'txRef'=> uniqid('txref'),
            'orderRef'=> uniqid('orderref'),
            'is_mobile_money_gh'=> 1,
            'redirectUrl'=> $flutterwave->success_url
        ]);
        $Flutterwave->pay();
    }

    public function twoCheckout()
    {
        $checkout = $this->getServiceData('twocheckout');
        if ($checkout->environment == 'sandbox') {
            $url = 'https://sandbox.2checkout.com/checkout/purchase';
        } else {
            $url = 'https://www.2checkout.com/checkout/purchase';
        }
        $array = array();
        foreach ($this->paymentData->products as $key => $product) {
            $price = baformsHelper::renderPrice((string)$product->price, '', '.', 2);
            $array['li_'.($key + 1).'_name'] = $product->title;
            $array['li_'.($key + 1).'_price'] = $price;
            $array['li_'.($key + 1).'_quantity'] = $product->quantity;
        }
        if (isset($this->paymentData->discount)) {
            $key++;
            $price = baformsHelper::renderPrice((string)$this->paymentData->discount, '', '.', 2);
            $array['li_'.($key + 1).'_price'] = $price;
            $array['li_'.($key + 1).'_type'] = 'coupon';
            $array['li_'.($key + 1).'_quantity'] = 1;
        }
?>
        <form id="payment-form" action="<?php echo $url; ?>" method="post">
            <input type="hidden" name="sid" value="<?php echo $checkout->account; ?>">
            <input type="hidden" name="mode" value="2CO">
            <input type="hidden" name="pay_method" value="PPI">
            <input type="hidden" name="x_receipt_link_url" value="<?php echo $checkout->return_url; ?>">
<?php
        foreach ($array as $key => $value) {
            echo '<input type="hidden" name="'.$key.'" value="'.$value.'">';
        }
?>
        </form>
        <script type="text/javascript">
            document.getElementById('payment-form').submit();
        </script>
<?php 
        exit;
    }
    
    public function paypal()
    {
        $paypal = $this->getServiceData('paypal');
        if ($paypal->environment == 'sandbox') {
            $url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';
        } else {
            $url = 'https://www.paypal.com/cgi-bin/webscr';
        }
        $array = array();
        foreach ($this->paymentData->products as $key => $product) {
            $array['amount_'.($key + 1)] = $product->price;
            $array['item_name_'.($key + 1)] = $product->title;
            $array['quantity_'.($key + 1)] = $product->quantity;
        }
        if (isset($this->paymentData->discount)) {
            $array['discount_amount_cart'] = $this->paymentData->discount;
        }
?>
        <form id="payment-form" action="<?php echo $url; ?>" method="post">
            <input type="hidden" name="cmd" value="_ext-enter">
            <input type="hidden" name="redirect_cmd" value="_cart">
            <input type="hidden" name="upload" value="1">
            <input type="hidden" name="business" value="<?php echo $paypal->email; ?>">
            <input type="hidden" name="receiver_email" value="<?php echo $paypal->email; ?>">
            <input type="hidden" name="currency_code" value="<?php echo $this->paymentData->code; ?>">
            <input type="hidden" name="return" value="<?php echo $paypal->return_url; ?>">
            <input type="hidden" name="cancel_return" value="<?php echo $paypal->return_url; ?>">
            <input type="hidden" name="rm" value="2">
            <input type="hidden" name="shipping" value="0">
            <input type="hidden" name="no_shipping" value="1">
            <input type="hidden" name="no_note" value="1">
            <input type="hidden" name="charset" value="utf-8">
<?php
        foreach ($array as $key => $value) {
?>
            <input type="hidden" name="<?php echo $key; ?>" value="<?php echo $value; ?>">
<?php
        }
?>    
        </form>
        <script type="text/javascript">
            document.getElementById('payment-form').submit();
        </script>
<?php
        exit;
    }

    public function stripeCharges($id, $name, $object)
    {
        $stripe = $this->getServiceData('stripe');
        $this->db = JFactory::getDbo();
        $field = $this->getFormField($name, $id);
        $this->preparePaymentData($id, '', $object, $field);
        $array = array(
            'payment_method_types' => array('card'),
            'line_items' => array(),
            'success_url' => $stripe->return_url,
            'cancel_url' => $stripe->return_url
            );
        $title = array();
        foreach ($this->paymentData->products as $product) {
            $title[] = $product->title;
        }
        $price = baformsHelper::renderPrice((string)$this->paymentData->total, '', '.', '2');
        $line_item = array();
        $line_item['name'] = implode(', ', $title);
        $line_item['amount'] = $price * 100;
        $line_item['quantity'] = 1;
        $line_item['currency'] = $this->paymentData->code;
        $array['line_items'][] = $line_item;
        $ua = array('bindings_version' => '7.17.0', 'lang' => 'php',
            'lang_version' => phpversion(), 'publisher' => 'stripe', 'uname' => php_uname());
        $headers = array('X-Stripe-Client-User-Agent: '.json_encode($ua),
            'User-Agent: Stripe/v1 PhpBindings/7.17.0',
            'Authorization: Bearer '.$stripe->secret_key);
        $curl = curl_init();
        $options = array();
        $options[CURLOPT_POST] = 1;
        $options[CURLOPT_POSTFIELDS] = $this->encode($array);
        $options[CURLOPT_URL] = 'https://api.stripe.com/v1/checkout/sessions';
        $options[CURLOPT_CONNECTTIMEOUT] = 30;
        $options[CURLOPT_TIMEOUT] = 80;
        $options[CURLOPT_RETURNTRANSFER] = true;
        $options[CURLOPT_HTTPHEADER] = $headers;
        $options[CURLOPT_SSL_VERIFYPEER] = false;
        curl_setopt_array($curl, $options);
        $body = curl_exec($curl);
        print_r($body);exit;
    }

    public function encode($arr, $prefix = null)
    {
        if (!is_array($arr))
            return $arr;
        $r = array();
        foreach ($arr as $k => $v) {
            if (is_null($v))
                continue;
            if ($prefix && $k && !is_int($k))
                $k = $prefix."[".$k."]";
            else if ($prefix)
                $k = $prefix."[]";
            if (is_array($v)) {
                $r[] = $this->encode($v, $k, true);
            } else {
                $r[] = urlencode($k)."=".urlencode($v);
            }
        }

        return implode("&", $r);
    }

    public function payAuthorize($id, $total, $cardNumber, $expirationDate, $cardCode)
    {
        $authorize = $this->getServiceData('authorize');
        $obj = new stdClass();
        $obj->createTransactionRequest = new stdClass();
        $obj->createTransactionRequest->merchantAuthentication = new stdClass();
        $obj->createTransactionRequest->merchantAuthentication->name = $authorize->login_id;
        $obj->createTransactionRequest->merchantAuthentication->transactionKey = $authorize->transaction_key;
        $obj->createTransactionRequest->clientId = 'sdk-php-2.0.0-ALPHA';
        $obj->createTransactionRequest->refId = 'ref'.time();
        $obj->createTransactionRequest->transactionRequest = new stdClass();
        $obj->createTransactionRequest->transactionRequest->transactionType = 'authCaptureTransaction';
        $obj->createTransactionRequest->transactionRequest->amount = $total;
        $obj->createTransactionRequest->transactionRequest->payment = new stdClass();
        $obj->createTransactionRequest->transactionRequest->payment->creditCard = new stdClass();
        $obj->createTransactionRequest->transactionRequest->payment->creditCard->cardNumber = $cardNumber;
        $obj->createTransactionRequest->transactionRequest->payment->creditCard->expirationDate = $expirationDate;
        $obj->createTransactionRequest->transactionRequest->payment->creditCard->cardCode = $cardCode;
        $xmlRequest = json_encode($obj);
        $url =  ($authorize->environment == 'sandbox' ? 'https://apitest.authorize.net' : 'https://api2.authorize.net').'/xml/v1/request.api';
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $xmlRequest);
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_TIMEOUT, 45);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($curl, CURLOPT_HTTPHEADER, Array("Content-Type: text/json"));
        $text = curl_exec($curl);
        curl_close($curl);
        $response = json_decode(substr($text, 3), true);
        $response['return_url'] = $authorize->return_url;
        $str = json_encode($response);
        print_r($str);exit;
    }

    public function getForm($data = array(), $loadData = true)
    {
        
    }
    
    public function save($data)
    {
        
    }
    
}