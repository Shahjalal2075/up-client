import PersonCertForm from '../../components/PersonCertForm';
import { CITIZEN_CFG, CITIZEN_PATH } from '../../components/AgriShell';

export default function CitizenNew() {
  return <PersonCertForm shellCfg={CITIZEN_CFG} endpoint="/citizen-certificates" listPath={CITIZEN_PATH} title="নাগরিকত্ব সনদের আবেদন ফরম" />;
}
