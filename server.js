const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

app.use(cors({
  origin: 'https://gatosdoacoes.netlify.app'
}));

app.get('/total-donations', async (req, res) => {
    try {
        let total = 0;
        let hasMore = true;
        let startingAfter = null;

        while (hasMore) {
            let params = {
                limit: 100,
                expand: ['data.refunds']
            };

            if (startingAfter) {
                params.starting_after = startingAfter;
            }

            const charges = await stripe.charges.list(params);

            charges.data.forEach(charge => {
                if (charge.status === 'succeeded') {
                    let amount = charge.amount;
                    if (charge.amount_refunded > 0) {
                        amount -= charge.amount_refunded;
                    }
                    total += amount;
                }
            });

            if (charges.has_more) {
                startingAfter = charges.data[charges.data.length - 1].id;
            } else {
                hasMore = false;
            }
        }

        res.json({ total: total / 100 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao obter total de doações' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
