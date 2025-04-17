import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from '@mui/material';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <ButtonGroup size="small" aria-label="language selector">
      <Button
        onClick={() => changeLanguage('en')}
        variant={i18n.language === 'en' ? 'contained' : 'outlined'}
      >
        English
      </Button>
      <Button
        onClick={() => changeLanguage('or')}
        variant={i18n.language === 'or' ? 'contained' : 'outlined'}
      >
        ଓଡ଼ିଆ
      </Button>
    </ButtonGroup>
  );
}