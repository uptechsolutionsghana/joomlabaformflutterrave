<?php
/**
* @package   BaForms
* @author    Balbooa http://www.balbooa.com/
* @copyright Copyright @ Balbooa
* @license   http://www.gnu.org/licenses/gpl.html GNU/GPL
*/

defined('_JEXEC') or die;

// import Joomla modelform library
jimport('joomla.application.component.modeladmin');

class baformsModelSubmissions extends JModelList
{
    public function __construct($config = array())
    {
        if (empty($config['filter_fields'])) {
            $config['filter_fields'] = array('id', 'title', 'date');
        }
        parent::__construct($config);
    }

    public function getSubmission()
    {
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('*')
            ->from('#__baforms_submissions')
            ->where('id = '.$id);
        $db->setQuery($query);
        $item = $db->loadObject();

        return $item;
    }
    
    protected function getListQuery()
    {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
            ->select('id, title, message, date_time, submission_state')
            ->from('#__baforms_submissions');
        $search = $this->getState('filter.search');
        $input = JFactory::getApplication()->input;
        $id = $input->get('id', 0, 'int');
        if (!empty($id)) {
            $query->where('id = '.$id);
        }
        if (!empty($search)) {
            $search = $db->quote('%' . $db->escape($search, true) . '%', false);
            $query->where('`title` LIKE ' . $search, 'OR')->where('`message` LIKE ' . $search);
        }
        $orderCol = $this->state->get('list.ordering', 'title');
        $orderDirn = $this->state->get('list.direction', 'desc');
        if ($orderCol == 'ordering') {
            $orderCol = 'title ' . $orderDirn . ', ordering';
        }
        $query->order($db->quoteName('id') . ' ' . $orderDirn);
        
        return $query;
    }
    
    protected function getStoreId($id = '')
    {
        $id .= ':' . $this->getState('filter.search');

        return parent::getStoreId($id);
    }
    
    public function populateState($ordering = null, $direction = null)
    {
        $search = $this->getUserStateFromRequest($this->context . '.filter.search', 'filter_search');
        $this->setState('filter.search', $search);
        $published = $this->getUserStateFromRequest($this->context . '.filter.state', 'filter_state', '');
        $this->setState('filter.state', $published);
        
        parent::populateState('id', 'desc');
    }
   
}