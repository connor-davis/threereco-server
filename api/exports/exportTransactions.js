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
  });

  r.db('threereco')
    .table('userTransactions')
    .filter(async (connection) => {
      return connection('purchaser')('id')
        .eq(request.user.id)
        .or(connection('seller')('id').eq('request.user.id'));
    })
    .run(connection, async (error, result) => {
      let data = await result.toArray();

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
    { header: 'Purchaser Phone Number', key: 'purchaserPhoneNumber' },
    { header: 'Purchaser Email', key: 'purchaserEmail' },
    { header: 'Seller ID', key: 'sellerId' },
    { header: 'Seller', key: 'seller' },
    { header: 'Seller Phone Number', key: 'sellerPhoneNumber' },
    { header: 'Seller Email', key: 'sellerEmail' },
    { header: 'Material', key: 'material' },
    { header: 'Weight', key: 'weight' },
    { header: 'Price', key: 'price' },
  ];

  data.forEach((d) => {
    sheet.addRow({
      date: moment(d.date).format('DD/MM/YYYY'),
      purchaserId: d.purchaser.userIdNumber,
      purchaser: d.purchaser.userDisplayName,
      purchaserPhoneNumber: d.purchaser.userPhoneNumber,
      purchaserEmail: d.purchaser.userEmail,
      sellerId: d.seller.userIdNumber,
      seller: d.seller.userDisplayName,
      sellerPhoneNumber: d.seller.userPhoneNumber,
      sellerEmail: d.seller.userEmail,
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
