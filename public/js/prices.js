/* Прайс-лист: DataTables с русской локализацией */
(function () {
  'use strict';
  if (typeof DataTable === 'undefined' || !document.getElementById('price-table')) return;

  new DataTable('#price-table', {
    responsive: true,
    autoWidth: false,
    pageLength: 25,
    lengthMenu: [
      [25, 50, -1],
      [25, 50, 'Все'],
    ],
    order: [],
    columnDefs: [
      { targets: 0, responsivePriority: 1 },
      { targets: 2, responsivePriority: 2, className: 'dt-right' },
      { targets: 5, responsivePriority: 3, orderable: false, searchable: false },
      { targets: 1, responsivePriority: 4 },
      { targets: 4, responsivePriority: 5 },
      { targets: 3, responsivePriority: 6, orderable: false },
    ],
    language: {
      search: 'Поиск:',
      searchPlaceholder: 'например, тетрадь',
      lengthMenu: 'Показывать по _MENU_',
      zeroRecords: 'По вашему запросу ничего не найдено',
      emptyTable: 'Прайс-лист обновляется',
      info: 'Позиции _START_–_END_ из _TOTAL_',
      infoEmpty: 'Нет позиций',
      infoFiltered: '(найдено среди _MAX_)',
      paginate: { first: '«', previous: '‹', next: '›', last: '»' },
      aria: {
        orderable: 'Сортировать по этому столбцу',
        orderableReverse: 'Сортировать в обратном порядке',
        paginate: { first: 'Первая страница', previous: 'Предыдущая страница', next: 'Следующая страница', last: 'Последняя страница' },
      },
    },
  });
})();
