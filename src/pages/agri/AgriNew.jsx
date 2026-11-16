import PersonCertForm from '../../components/PersonCertForm';
import { AGRI_CFG, AGRI_PATH } from '../../components/AgriShell';

export default function AgriNew() {
  return <PersonCertForm shellCfg={AGRI_CFG} endpoint="/agri-certificates" listPath={AGRI_PATH} title="কৃষি প্রত্যয়নপত্রের আবেদন ফরম" />;
}
