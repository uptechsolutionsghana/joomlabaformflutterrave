<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

jimport('joomla.application.component.view');

class baformsViewForm extends JViewLegacy
{
    public $about;
    public $item;
    public $pages;
    public $templates;
    public $googleFont;
    public $formOptions;
    public $formSettings;
    public $integrations;
    public $sheetsAuthentication;
    public $driveAuthentication;
    public $user;
    public $formTemplates;

    public function display($tpl = null)
    {
        $this->about = baformsHelper::aboutUs();
        $this->item = $this->get('Item');
        $this->user = JFactory::getUser();
        if (empty($this->item) || empty($this->item->id)) {
            if (!JFactory::getUser()->authorise('core.create', 'com_baforms')) {
                return JError::raiseWarning(404, JText::_('JERROR_ALERTNOAUTHOR'));
            }
            $this->setLayout('create');
        } else {
            if (!JFactory::getUser()->authorise('core.edit', 'com_baforms')) {
                return JError::raiseWarning(404, JText::_('JERROR_ALERTNOAUTHOR'));
            }
            $this->formOptions = $this->get('FormOptions');
            compatibleCheck::checkForm($this->item->id, $this->formOptions);
            $this->integrations = baformsHelper::getIntegrations($this->item->id);
            $this->pages = $this->get('Pages');
            $this->templates = baformsHelper::getTemplates($this->formOptions);
            $this->formSettings = baformsHelper::getFormsSettings($this->item->id, $this->formOptions);
            $this->googleFont = $this->get('GoogleFonts');
            $this->form = $this->get('Form');
            $scope = array('https://www.googleapis.com/auth/userinfo.email', 'https://spreadsheets.google.com/feeds');
            $this->sheetsAuthentication = baformsHelper::getGoogleAuth($scope);
            $scope = array('https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive');
            $this->driveAuthentication = baformsHelper::getGoogleAuth($scope);
            $this->formTemplates = $this->get('FormTemplates');
        }
        $input = JFactory::getApplication()->input;
        $input->set('hidemainmenu', true);
        JToolBarHelper::title(JText::_('FORMS'), 'star');

        parent::display($tpl);
    }
}