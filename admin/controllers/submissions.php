<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

jimport('joomla.application.component.controlleradmin');

class BaformsControllerSubmissions extends JControllerAdmin
{
    public function getModel($name = 'submission', $prefix = 'baformsModel', $config = array()) 
    {
        $model = parent::getModel($name, $prefix, array('ignore_request' => true));
        return $model;
    }

    public function removeTmpAttachment()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $submission = $input->get('submission', 0, 'ind');
        $filename = $input->get('filename', '', 'string');
        $model = $this->getModel();
        $model->removeTmpAttachment($id, $filename, $submission);
        exit();
    }

    public function delete()
    {
        $input = JFactory::getApplication()->input;
        $cid = $input->get('cid', array(), 'array');
        $model = $this->getModel();
        $model->deleteFiles($cid);
        parent::delete();
    }
    
    public function setReadStatus()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $model = $this->getModel();
        $model->setReadStatus($id);
        exit;
    }

    public function getTotal($str)
    {
        $object = json_decode($str);
        $thousand = $object->options->thousand;
        $separator = $object->options->separator;
        $decimals = $object->options->decimals;
        $total = $object->total * 1;
        if ($object->options->tax->enable) {
            $tax = $total * $object->options->tax->value / 100;
            $total += $tax;
        }
        if (isset($object->promo)) {
            $discount = $object->options->promo->discount * 1;
            if ($object->options->promo->unit == '%') {
                $discount = $total * $discount / 100;
            }
            $total -= $discount;
        }
        if (isset($object->shipping)) {
            $shipping = $object->shipping->price * 1;
        }
        $price = $this->renderPrice((string)$total, $thousand, $separator, $decimals);
        if (!empty($object->options->position)) {
            $price .= ' '.$object->options->symbol;
        } else {
            $price = $object->options->symbol.' '.$price;
        }

        return $price;
    }

    public function renderPrice($value, $thousand, $separator, $decimals)
    {
        $delta = $value < 0 ? '-' : '';
        $value = str_replace('-', '', $value);
        $priceArray = explode('.', $value);
        $priceThousand = $priceArray[0];
        $priceDecimal = isset($priceArray[1]) ? $priceArray[1] : '';
        $value = '';
        if (($pricestrlen = strlen($priceThousand)) > 3 && $thousand != '') {
            for ($i = 0; $i < $pricestrlen; $i++) {
                if ($i % 3 == 0 && $i != 0) {
                    $value .= $thousand;
                }
                $value .= $priceThousand[$pricestrlen - 1 - $i];
            }
            $value = strrev($value);
        } else {
            $value .= $priceThousand;
        }
        if ($decimals != 0) {
            $value .= $separator;
            for ($i = 0; $i < $decimals; $i++) {
                $value .= isset($priceDecimal[$i]) ? $priceDecimal[$i] : '0';
            }
        }

        return $delta.$value;
    }
    
    public function exportXML()
    {
        $data = $_POST['exportData'];
        $data = str_replace('*', '', $data);
        $data = explode('|__|', $data);
        $doc = new DOMDocument('1.0');
        $doc->formatOutput = true;
        $root = $doc->createElement('submissions');
        $root = $doc->appendChild($root);
        $model = $this->getModel();
        foreach($data as $item) {
            if (!empty($item)) {
                $item = json_decode($item);
                $obj = $model->getMessage($item->id);
                $postroot = $doc->createElement('submission');
                $postroot = $root->appendChild($postroot);
                $title = $doc->createElement('title');
                $title = $postroot->appendChild($title);
                $text = $doc->createTextNode($item->form);
                $text = $title->appendChild($text);
                $title = $doc->createElement('date');
                $title = $postroot->appendChild($title);
                $text = $doc->createTextNode($obj->date_time);
                $text = $title->appendChild($text);
                $message = explode('_-_', $obj->message);
                foreach($message as $mes) {
                    if (!empty($mes)) {
                        $mes = strip_tags($mes);
                        $mes = explode('|-_-|', $mes);
                        $patern = array('~', '`', '!', '@', '"', '#', '№', '$', ';', '%', '^', '&', '?', '*',
                            '(', ')', '-', '+', '=', '/', '|', '.', "'", ',', '\\', '€');
                        $replace = ' ';
                        $mes[0] = str_replace($patern, $replace, $mes[0]);
                        if ($mes[1] == ';') {
                            $mes[1] = '';
                        }
                        $title = $doc->createElement(str_replace(' ', '_', $mes[0]));
                        $title = $postroot->appendChild($title);
                        if ($mes[2] == 'total') {
                            $total = $this->getTotal($mes[1]);
                            $text = $doc->createTextNode($total);
                        } else {
                            $text = $doc->createTextNode($mes[1]);
                        }
                        $text = $title->appendChild($text);
                    }
                }
            }
        }
        $file = '/tmp/baform.xml';
        $bytes = $doc->save(JPATH_ROOT.$file); 
        if ($bytes) {
            echo new JResponseJson(true, JPATH_ROOT.$file);
        } else {
            echo new JResponseJson(false, '', true);
        }
        jexit();
    }

    public function showSubmission()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $model = $this->getModel();
        $obj = $model->getMessage($id);
        $obj->time = date('H:i', strtotime($obj->date_time));
        $obj->files = $model->getFiles($id);
        $msg = json_encode($obj);
        echo $msg;exit();
    }
    
    public function exportCSV()
    {
        $data = $_POST['exportData'];
        $data = explode('|__|', $data);
        $list = array();
        $form = '';
        $model = $this->getModel();
        foreach($data as $item) {
            if (!empty($item)) {
                $item = json_decode($item);
                $obj = $model->getMessage($item->id);
                $title = array('Date', 'Id');
                $info = array($obj->date_time, $item->id);
                $message = explode('_-_', $obj->message);
                foreach($message as $mes) {
                    if (!empty($mes)) {
                        $mes = strip_tags($mes);
                        $mes = explode('|-_-|', $mes);
                        if ($mes[1] == ';') {
                            $mes[1] = '';
                        }
                        $title[] = $mes[0];
                        if ($mes[2] == 'total') {
                            $total = $this->getTotal($mes[1]);
                            $info[] = $total;
                        } else {
                            $info[] = $mes[1];
                        }
                    }
                }
                if ($item->form != $form) {
                    $list[] = array($item->form);
                    $list[] = $title;
                }
                $list[] = $info;
                $form = $item->form;
            }
        }
        $file =  '/tmp/baform.csv';
        $fp = fopen(JPATH_ROOT.$file, 'w');
        fwrite ($fp, b"\xEF\xBB\xBF");
        foreach ($list as $fields) {
            fputcsv($fp, $fields);
        }
        fclose($fp);
        echo new JResponseJson(true, JPATH_ROOT.$file);
        jexit();
    }
    
    public function download()
    {
        $file = $_GET['file'];
        if (file_exists($file)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename='.basename($file));
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: '.filesize($file));
            if (readfile($file)) {
                unlink($file);
            }
            exit;
        }
    }
}