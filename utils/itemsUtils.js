const pool = require('./dbUtils');

async function getItems() {

    console.log("getitems() 호출 성공")

  const query = `SELECT * FROM items WHERE is_available = TRUE`;

  try {
    const [allItems] = await pool.execute(query);
    return allItems;
  } catch (err) {
    console.error('Error gettig items:', err);
    throw err;
  }
}

async function getItemById(itemId) {
    console.log("getItemById() 호출 성공, itemId:", itemId);
    const query = `SELECT * FROM items WHERE id = ? AND is_available = TRUE`;
    try {
      const [rows] = await pool.execute(query, [itemId]);
      if (rows.length === 0) return null;
      return rows[0];
    } catch (err) {
      console.error('Error getting item by id:', err);
      throw err;
    }
  }


  async function getItemOptions(itemId) {
    const query = `
      SELECT 
        ot.id AS template_id, 
        ot.name AS template_name, 
        ot.is_required, 
        ot.option_type,
        otv.id AS choice_id, 
        otv.value AS choice_value, 
        otv.extra_price
      FROM item_option_templates iot
      JOIN option_templates ot ON iot.template_id = ot.id
      LEFT JOIN option_template_values otv ON ot.id = otv.template_id
      WHERE iot.item_id = ?
      ORDER BY ot.id, otv.id;
    `;
    try {
      const [rows] = await pool.execute(query, [itemId]);
      // 그룹핑: 같은 템플릿에 속하는 선택지들을 묶어 옵션 그룹 객체로 만듭니다.
      const groups = [];
      let currentGroup = null;
      rows.forEach(row => {
        if (!currentGroup || currentGroup.template_id !== row.template_id) {
          currentGroup = {
            id: row.template_id,
            name: row.template_name,
            is_required: row.is_required,
            option_type: row.option_type,
            choices: []
          };
          groups.push(currentGroup);
        }
        if (row.choice_id) {
          currentGroup.choices.push({
            id: row.choice_id,
            value: row.choice_value,
            extra_price: row.extra_price
          });
        }
      });
      return groups;
    } catch (err) {
      console.error('Error getting item options:', err);
      throw err;
    }
  }

  


module.exports = { getItems, getItemById, getItemOptions };
