// Файлы библиотек из node_modules, которые отдаются по адресу /vendor/<имя>
const path = require('node:path');

const nm = (...p) => path.resolve(__dirname, '..', 'node_modules', ...p);

module.exports = {
  'dataTables.min.js': nm('datatables.net', 'js', 'dataTables.min.js'),
  'dataTables.dataTables.min.css': nm('datatables.net-dt', 'css', 'dataTables.dataTables.min.css'),
  'dataTables.responsive.min.js': nm('datatables.net-responsive', 'js', 'dataTables.responsive.min.js'),
  'responsive.dataTables.min.css': nm('datatables.net-responsive-dt', 'css', 'responsive.dataTables.min.css'),
};
