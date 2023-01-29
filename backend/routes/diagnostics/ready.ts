import { getOfferSummary } from "../../utils/get-offer-summary.js";
import { pool } from "../../utils/query-db.js";
import { logger } from "../../utils/logger.js";

const exampleOffer =
  "offer1qqph3wlykhv8jcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafsyjlm5pqpj3dnq0kj8d2rhzr0n5ah7m47uu4f80v3z4zm7702wmnuah83grkzjhmfqegyjg0060h8u7va8t57w0ufh6n3wzf08k6y7mws4nl5zsf4yktxy4c28g0lamlr0fyh09ccxqzftq5ukgelgjumgd53ga9xh8j4h879mj7mwc5m3zmkmh6ha7s39089pntg28e70ct4xwuunhljqcpr58f705xsll2lwjm8x07jn5xm4tqkfg95d6tjc8fsgg9mp5wpnpjz96m5zpn8gyrxdqxuysxjw6p044wxg9a7lhhuwphnff6my6aujm3m37wvl6q0kzy3tde6nh7w9j6d0nlch8n3j4nd7kls0gavnu7kwjpe4n8vtudxl6rd06al46trse8knj70r4fd5ur7cw539e7qggqmfmlegm4sutf0xwe2ht366577aj29uhlykns7k3wcjdg2h9cf38t6y8xcyxqa0gvmusalvqzt7cypdl70pvhlzzjlvrsx0dl0kd4sv56m8j4wt2txevnws7qlltrnvnpmqlx30flupcjxf9y5zvg4hmldycj6v4fx5en624exy429dg5hn6jpdchynk2fwe5kyjj3t9jhzxfee889y4242g89r6jeg9ryjc32txmzn709geax2hspp80wvs26x90dukjfw9yhu5tz0g49annxtcmrafdfskqaas278fg9rxgtpehzeudly6alwkk7xm2dkafrgkeeutf6ul704uw49u2d07q2l747yqzp3fkypldljpzdk4myj4nk0qvaq0kpll3ljpptx2mjkgf48uc2606s45jjgztptecpl2cv2fdqxgmkxsfaem4nv2wjvcr08rlxmqcue2sdh4axsm3vew8me574ymmauvjclfpgdepu3jzu56fwmxtual0cl45p89knjn4tvmkrnwkng0pzaf06a7nmpl7lz7raqqkzvll4l9ajntl6x3940lhchxuur4fhf7w4nd0da43gndn89ht6uneu7j73hje382azczqjl0rqwpw8quzcjwr8ll5tpg93w8zf7cwpfpvh0ar49090t2uc53pagma0hpc4u6w5heza09hfp20ehru9z4dkmw3846rdzp3tgagt4fdrc046xsltsd7lsrg62a6xhl4dpql8zn86lve6z52mk6prx396lt4puhlvdfc7urk3t2mmjccy6hjclyz9enqqe2cr7f0qxr3vkhkpw0qz3h09pl8y2z3lnmjaz6tclxjdzk4dca89902u5czfalk6he60tyt3xg7ck4xmdeqxa870ph9z6w7kv8jhja6fns22c5rdg6nll7zecnc5pmczlwm2kxm7apuscwzf8ukdh0dk8huu2ulu4v04qjdvl0yfntl30dzydy7lc9nuwe7k0a5fndnq3ml57a2lpncec2kaecrf40mzswnzmk9mqj7qud8kqpcrrdn6qpnuvphczgf36ly9uqrkvvy25pyef6x8rlmdl7h6syxt3ev0lcd3j79d7ljv3zkg09u94379hr7xzek7sln4rwhmsuxa9qkykmkaxyh034tfzsh5wnqe4e6lmu395yaet4j8m8lyuwc5lh9m2650c80rtn0jqc9lw8teme7r9e2tl6ekhu4v9ulvl7nua3r7qmll62p2dj7kxglmw777a67j4nyc7hyum3775aujaue0tauyx7kaqx752cyajtnslmm8syqrg0gr5qc3ldl5";
let counter = 0;

export const readyRoute = async (req: any, res: any) => {
  // Ready gets called by the LB a lot
  // only check external services the first time and then 0.1% of the time
  if (counter && counter < 1000) {
    res.json({ ready: true });
    counter++;
    return;
  }
  try {
    const pgResult = await pool.query(`SELECT 1;`);
    const offerSummary = await getOfferSummary(exampleOffer);
    if (pgResult.rows.length > 0 && offerSummary.success) {
      res.json({ ready: true });
      counter = 1;
      return;
    }
  } catch (e) {
    logger.error(e, "Ready Route Error");
  }
  counter = 0;
  res.status(500).json({ ready: false });
  return;
};
