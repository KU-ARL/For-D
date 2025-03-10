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
        io.id AS template_id, 
        io.name AS template_name, 
        io.is_required, 
        ov.id AS choice_id, 
        ov.value AS choice_value, 
        ov.extra_price
      FROM item_option_relations ior
      JOIN item_options io ON ior.option_id = io.id
      LEFT JOIN option_values ov ON io.id = ov.option_id
      WHERE ior.item_id = ?
      ORDER BY io.id, ov.id;
    `;

    try {
        const [rows] = await pool.execute(query, [itemId]);

        // 그룹핑: 같은 옵션 그룹에 속하는 선택지들을 묶기
        const groups = [];
        let currentGroup = null;
        rows.forEach(row => {
            if (!currentGroup || currentGroup.template_id !== row.template_id) {
                currentGroup = {
                    id: row.template_id,
                    name: row.template_name,
                    is_required: row.is_required,
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
