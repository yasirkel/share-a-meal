const { expect } = require('chai');
const { buildMealFields } = require('../src/dao/meal.dao');

describe('meal DAO query building', () => {
  it('uses live-schema fallback fields for seeded meal retrieval', () => {
    const fields = buildMealFields(new Set([
      'id',
      'name',
      'description',
      'price',
      'dateTime',
      'maxAmountOfParticipants',
      'imageUrl',
      'cookId',
      'isActive',
      'isVega',
      'isVegan',
      'isToTakeHome',
      'allergies',
    ]));

    expect(fields).to.contain('m.allergies AS allergenes');
    expect(fields).to.contain('NULL AS createDate');
    expect(fields).to.contain('NULL AS updateDate');
    expect(fields).not.to.contain('m.allergenes,');
    expect(fields).not.to.contain('m.createDate');
    expect(fields).not.to.contain('m.updateDate');
  });
});
