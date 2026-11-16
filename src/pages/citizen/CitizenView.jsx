import PersonCertView from '../../components/PersonCertView';
import CitizenCertificate from '../../components/CitizenCertificate';
import { CITIZEN_CFG, CITIZEN_PATH } from '../../components/AgriShell';

export default function CitizenView() {
  return <PersonCertView shellCfg={CITIZEN_CFG} endpoint="/citizen-certificates" listPath={CITIZEN_PATH} Cert={CitizenCertificate} filePrefix="nagorik-sonod" />;
}
