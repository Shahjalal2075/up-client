import PersonCertView from '../../components/PersonCertView';
import Certificate from '../../components/Certificate';
import { AGRI_CFG, AGRI_PATH } from '../../components/AgriShell';

export default function AgriView() {
  return <PersonCertView shellCfg={AGRI_CFG} endpoint="/agri-certificates" listPath={AGRI_PATH} Cert={Certificate} filePrefix="krishi-protyoyonpotro" />;
}
