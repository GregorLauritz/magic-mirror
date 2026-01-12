export const task_list_schema = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'TaskList',
  type: 'object',
  required: ['count', 'list'],
  properties: {
    count: {
      $id: '#root/count',
      title: 'Count',
      type: 'integer',
      default: 0,
    },
    list: {
      $id: '#root/list',
      title: 'List',
      type: 'array',
      default: [],
      items: {
        $id: '#root/list/items',
        title: 'Items',
        type: 'object',
        required: ['id', 'title', 'status'],
        properties: {
          id: {
            $id: '#root/list/items/id',
            title: 'Id',
            type: 'string',
            default: '',
            pattern: '^.*$',
          },
          title: {
            $id: '#root/list/items/title',
            title: 'Title',
            type: 'string',
            default: '',
            pattern: '^.*$',
          },
          notes: {
            $id: '#root/list/items/notes',
            title: 'Notes',
            type: 'string',
          },
          status: {
            $id: '#root/list/items/status',
            title: 'Status',
            type: 'string',
            default: '',
            pattern: '^.*$',
          },
          due: {
            $id: '#root/list/items/due',
            title: 'Due',
            type: 'string',
          },
          completed: {
            $id: '#root/list/items/completed',
            title: 'Completed',
            type: 'string',
          },
        },
      },
    },
  },
};
