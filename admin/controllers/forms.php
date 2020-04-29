<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

// import Joomla controlleradmin library
jimport('joomla.application.component.controlleradmin');
jimport('joomla.filesystem.file');
jimport('joomla.filesystem.folder');

class BaformsControllerForms extends JControllerAdmin
{
    public function getModel($name = 'form', $prefix = 'baformsModel', $config = array()) 
    {
        $model = parent::getModel($name, $prefix, array('ignore_request' => true));

        return $model;
    }

    public function delete()
    {
        JSession::checkToken() or die(JText::_('JINVALID_TOKEN'));
        $cid = $this->input->get('cid', array(), 'array');
        $model = $this->getModel();
        if ($model->delete($cid)) {
            $this->setMessage(JText::plural($this->text_prefix . '_N_ITEMS_DELETED', count($cid)));
        } else {
            $this->setMessage($model->getError(), 'error');
        }
        $this->postDeleteHook($model, $cid);
        $this->setRedirect(JRoute::_('index.php?option=com_baforms&view=trashed', false));
    }

    public function versionCompare()
    {
        $about = baformsHelper::aboutUs();
        $input = JFactory::getApplication()->input;
        $version = $input->get('version', '', 'string');
        $compare = version_compare($about->version, $version);
        echo $compare;
        exit();
    }

    public function checkFormsState()
    {
        $state = baformsHelper::checkFormsState();
        print_r($state);exit();
    }

    public function getUserLicense()
    {
        $input = JFactory::getApplication()->input;
        $data = $input->get('data', '', 'string');
        baformsHelper::setAppLicense($data);
    }

    public function setFilters()
    {
        $input = JFactory::getApplication()->input;
        $view = $input->get('view', '', 'string');
        $model = $this->getModel($view);
        $model->populateState();
        exit;
    }

    public function restore()
    {
        $pks = $this->input->getVar('cid', array(), 'post', 'array');
        $model = $this->getModel();
        $model->restore($pks);
        $this->setMessage(JText::_('ITEMS_RESTORED'));
        $this->setRedirect('index.php?option=com_baforms&view=trashed');
    }
    
    public function duplicate()
    {
        $pks = $this->input->getVar('cid', array(), 'post', 'array');
        $model = $this->getModel();
        $model->duplicate($pks);
        $this->setMessage(JText::plural('FORM_DUPLICATED', count($pks)));
        $this->setRedirect('index.php?option=com_baforms&view=forms');
    }
    
    public function updateForms()
    {
        $config = JFactory::getConfig();
        $path = $config->get('tmp_path').'/pkg_BaForms.zip';
        $data = file_get_contents('php://input');
        $obj = json_decode($data);
        $method = $obj->method;
        $data = $method($obj->package);
        $file = fopen($path, "w+");
        fputs($file, $data);
        fclose($file);
        JArchive::extract($path, $config->get('tmp_path').'/pkg_BaForms');
        $installer = JInstaller::getInstance();
        $result = $installer->update($config->get('tmp_path').'/pkg_BaForms');
        JFile::delete($path);
        JFolder::delete($config->get('tmp_path').'/pkg_BaForms');
        exit;
    }

    public function addLanguage()
    {
        $input = JFactory::getApplication()->input;
        $method = $input->get('method', '', 'string');
        $url = $input->get('url', '', 'string');
        $zip = $input->get('zip', '', 'string');
        $name = explode('/', $url);
        $name = end($name);
        $config = JFactory::getConfig();
        $tmp_path = $config->get('tmp_path');
        $path = $tmp_path.'/'.$name;
        $name = explode('.', $name);
        $data = $method($zip);
        $file = fopen($path, "w+");
        fputs($file, $data);
        fclose($file);
        JArchive::extract($path, $tmp_path.'/'.$name[0]);
        $installer = JInstaller::getInstance();
        $result = $installer->install($tmp_path.'/'.$name[0]);
        JFile::delete($path);
        JFolder::delete($tmp_path.'/'.$name[0]);
        echo JText::_('SUCCESS_INSTALL');
        exit;
    }

    public function addLibrary()
    {
        $input = JFactory::getApplication()->input;
        $method = $input->get('method', '', 'string');
        $folder = $input->get('folder', '', 'string');
        $zip = $input->get('zip', '', 'string');
        $package = $input->get('package', '', 'string');
        $data = $method($package);
        $path = JPATH_ROOT.'/components/com_baforms/libraries/';
        $file = fopen($path.$zip, "w+");
        fputs($file, $data);
        fclose($file);
        JArchive::extract($path.$zip, $path.$folder);
        JFile::delete($path.$zip);
        echo JText::_('SUCCESS_INSTALL');
        exit;
    }

    public function exportForms()
    {
        $model = $this->getModel();
        $model->exportForms();
    }

    public function exportForm()
    {
        $input = JFactory::getApplication()->input;
        $export = $input->get('export_id', '', 'string');
        $cid = explode(';', $export);
        $model = $this->getModel();
        $model->exportForm($cid);
    }

    public function download()
    {
        $file = JPATH_ROOT.'/tmp/forms.xml';
        if (file_exists($file)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename='.basename($file));
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($file));
            readfile($file);
            exit;
        }
    }

    public function importForms()
    {
        $model = $this->getModel();
        $input = JFactory::getApplication()->input;
        $files = $input->files->get('ba-files', '', 'array');
        foreach ($files as $item) {
            $name = JPATH_ROOT.'/tmp/'.$item['name'];
            if(!JFile::upload($item['tmp_name'], $name)) {
                $this->setRedirect('index.php?option=com_baforms&view=forms', JText::_('UPLOAD_ERROR'), 'error');
                return false;
            }
        }
        $xml = simplexml_load_file($name);
        $model->importForms($xml);
        $this->setRedirect('index.php?option=com_baforms&view=forms', JText::_('SUCCESS_UPLOAD'));
    }
}