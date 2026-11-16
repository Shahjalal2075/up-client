import PersonCertView from '../../components/PersonCertView';
import TradeCertificate from '../../components/TradeCertificate';
import { TRADE_CFG, TRADE_PATH } from '../../components/AgriShell';

export default function TradeView() {
  return (
    <PersonCertView
      shellCfg={TRADE_CFG} endpoint="/trade-licenses" listPath={TRADE_PATH} Cert={TradeCertificate}
      filePrefix="trade-license" actionPath={TRADE_PATH} actionLabel="তালিকা দেখুন"
    />
  );
}
