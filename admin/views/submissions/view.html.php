<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

// import Joomla view library
jimport('joomla.application.component.view');
 

class baformsViewSubmissions extends JViewLegacy
{
    protected $items;
    protected $pagination;
    protected $state;
    protected $about;
    protected $uploaded_path;
    protected $user;
    protected $submission;

    public function display($tpl = null) 
    {
        $input = JFactory::getApplication()->input;
        $layout = $input->get('layout', '');
        $this->user = JFactory::getUser();
        $this->items = $this->get('Items');
        $this->about = baformsHelper::aboutUs();
        if ($layout == 'pdf' || $layout == 'print') {
            $this->submission = $this->get('Submission');
        }
        if (empty($layout)) {
            $this->pagination = $this->get('Pagination');
            $this->state = $this->get('State');
            $this->addToolBar();
            foreach ($this->items as &$item) {
                $item->order_up = true;
                $item->order_dn = true;
            }
        }
        $params = JComponentHelper::getParams('com_baforms');
        $this->uploaded_path = $params->get('uploaded_path', 'images');
        $doc = JFactory::getDocument();
        $doc->addStyleSheet(JUri::root().'/components/com_baforms/assets/icons/material/material.css');
        $doc->addStyleSheet('components/com_baforms/assets/css/ba-admin.css?'.$this->about->version);
        $doc->addScriptDeclaration('var uploaded_path = "'.$this->uploaded_path.'";');

        parent::display($tpl);
    }
    
    protected function addToolBar()
    {
        JToolBarHelper::title(JText::_('SUBMISSIONS'), 'star');
        JToolBarHelper::custom('submissions.export', 'download.png', 'download.png', 'EXPORT', true);
        if ($this->user->authorise('core.delete', 'com_baforms')) {
            JToolBarHelper::deleteList('', 'submissions.delete');
        }
    }
}