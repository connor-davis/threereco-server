let { Router } = require('express');
let router = Router();
let r = require('rethinkdb');
let ExcelJS = require('exceljs');
let moment = require('moment');
let logger = require('../../utils/logger');
let fs = require('fs');

router.get('/', async (request, response) => {
  let m1 = moment();
  let operationStarted =
    m1.milliseconds() +
    1000 * (m1.seconds() + 60 * (m1.minutes() + 60 * m1.hours()));

  let devmode = process.env.DEV_MODE === "true";
  let connection = await r.connect({
      host: devmode ? 'localhost' : process.env.RETHINK,
      port: 28015,
      user: "admin",
      password: process.env.ROOT_PASSWORD
    });

  r.db('threereco')
    .table('userMaterials')
    .filter({ user: request.user.id })
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user materials', error });

        logger.error(error);

        return logger.info(
          `Operation took ${operationEnded - operationStarted}ms.`
        );
      } else {
        if (data.length >= 1) {
          // Generate excel file
          let path = await generateExcel(request.user.id, data);

          response.set(
            'Content-disposition',
            'attachment; filename=Materials-' + request.user.id + '.xlsx'
          );
          response.set(
            'Content-type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64'
          );
          response.status(200).download(path);

          logger.success('Exported user materials to excel file.');

          setTimeout(() => {
            fs.unlinkSync(path);
          }, 10000);

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response
            .status(200)
            .json({ message: 'Error while finding user materials.', data: [] });

          logger.error('Could not find user materials.');

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        }
      }
    });
});

let generateExcel = async (id, data) => {
  let workbook = new ExcelJS.Workbook();

  workbook.creator = '3rEco';
  workbook.lastModifiedBy = '3rEco Server';
  workbook.created = new Date();
  workbook.modified = new Date();
  // workbook.lastPrinted

  let sheet = workbook.addWorksheet('Materials', {
    headerFooter: { firstHeader: 'Materials' },
  });

  sheet.columns = [
    { header: 'Name', key: 'name' },
    { header: 'Value', key: 'value' },
  ];

  data.forEach((d) => {
    sheet.addRow({ name: d.materialName, value: d.materialValue });
  });

  await workbook.xlsx.writeFile('./temp/Materials-' + id + '.xlsx');

  return './temp/Materials-' + id + '.xlsx';
};

module.exports = router;
