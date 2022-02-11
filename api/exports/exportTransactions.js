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

  let connection = await r.connect();

  r.db('threereco')
    .table('userTransactions')
    .run(connection, async (error, result) => {
      let data = await result.toArray();

      data = data.filter(
        (d) =>
          d.purchaser.id === request.user.id || d.seller.id == request.user.id
      );

      let m2 = moment();
      let operationEnded =
        m2.milliseconds() +
        1000 * (m2.seconds() + 60 * (m2.minutes() + 60 * m2.hours()));

      if (error) {
        response
          .status(500)
          .json({ message: 'Error while finding user transactions', error });

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
            'attachment; filename=Transactions-' + request.user.id + '.xlsx'
          );
          response.set(
            'Content-type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64'
          );
          response.status(200).download(path);

          logger.success('Exported user transactions to excel file.');

          setTimeout(() => {
            fs.unlinkSync(path);
          }, 10000);

          return logger.info(
            `Operation took ${operationEnded - operationStarted}ms.`
          );
        } else {
          response.status(200).json({
            message: 'Error while finding user transactions.',
            data: [],
          });

          logger.error('Could not find user transactions.');

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

  let sheet = workbook.addWorksheet('Transactions', {
    headerFooter: { firstHeader: 'Transactions' },
  });

  sheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Purchaser ID', key: 'purchaserId' },
    { header: 'Purchaser', key: 'purchaser' },
    { header: 'Seller ID', key: 'sellerId' },
    { header: 'Seller', key: 'seller' },
    { header: 'Material', key: 'material' },
    { header: 'Weight', key: 'weight' },
    { header: 'Price', key: 'price' },
  ];

  data.forEach((d) => {
    sheet.addRow({
      date: moment(d.date).format('DD/MM/YYYY'),
      purchaserId: d.purchaser.userIdNumber,
      purchaser: d.purchaser.userDisplayName,
      sellerId: d.seller.userIdNumber,
      seller: d.seller.userDisplayName,
      material: d.material.materialName,
      weight: d.weight + 'kg',
      price: 'R' + d.price,
    });
  });

  sheet.columns.forEach(column => {
    const lengths = column.values.map(v => v.toString().length);
    const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
    column.width = maxLength;
  });

  await workbook.xlsx.writeFile('./temp/Transactions-' + id + '.xlsx');

  return './temp/Transactions-' + id + '.xlsx';
};

module.exports = router;
