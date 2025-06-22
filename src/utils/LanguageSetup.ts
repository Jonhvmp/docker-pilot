/**
 * Language Setup Utility
 * Handles initial language configuration and setup
 */

import inquirer from 'inquirer';
import { SupportedLanguage } from '../types';
import { I18n } from './i18n';

export interface LanguageChoice {
  name: string;
  value: SupportedLanguage;
  short: string;
}

export class LanguageSetup {
  private i18n: I18n;

  constructor() {
    this.i18n = new I18n();
  }

  /**
   * Get available language choices
   */
  private getLanguageChoices(): LanguageChoice[] {
    return [
      {
        name: '🇺🇸 English',
        value: 'en',
        short: 'English'
      },
      {
        name: '🇧🇷 Português Brasileiro',
        value: 'pt-br',
        short: 'Português'
      }
    ];
  }

  /**
   * Auto-detect system language
   */
  private detectSystemLanguage(): SupportedLanguage {
    const lang = process.env['LANG'] || process.env['LANGUAGE'] || '';

    if (lang.toLowerCase().includes('pt')) {
      return 'pt-br';
    }

    return 'en';
  }

  /**
   * Show language selection prompt
   */
  async promptLanguageSelection(): Promise<SupportedLanguage> {
    const detectedLanguage = this.detectSystemLanguage();
    const choices = this.getLanguageChoices();

    console.log('\n🌍 Docker Pilot - Language Setup');
    console.log('═══════════════════════════════════\n');

    // Show detected language
    const detectedChoice = choices.find(c => c.value === detectedLanguage);
    if (detectedChoice) {
      console.log(`🔍 Detected system language: ${detectedChoice.name}`);
    }

    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: 'Choose your preferred language / Escolha seu idioma:',
        choices: [
          ...choices,
          new inquirer.Separator(),
          {
            name: '🔄 Auto-detect (recommended)',
            value: 'auto',
            short: 'Auto'
          }
        ],
        default: 'auto'
      }
    ]);

    if (response.language === 'auto') {
      return detectedLanguage;
    }

    return response.language as SupportedLanguage;
  }
  /**
   * Show welcome message in selected language
   */
  showWelcomeMessage(language: SupportedLanguage): void {
    this.i18n.setLanguage(language);

    console.log('🌟 ' + this.i18n.t('setup.language_configured'));
    console.log('🚀 ' + this.i18n.t('setup.ready_to_start'));

    if (language === 'pt-br') {
      console.log('💡 Agora toda a interface estará em português!');
    } else {
      console.log('💡 The interface is now configured in English!');
    }

    console.log('');
  }

  /**
   * Check if language setup is needed
   */
  isLanguageSetupNeeded(configLanguage?: SupportedLanguage): boolean {
    // If no language is configured, setup is needed
    if (!configLanguage) {
      return true;
    }

    // If it's set to default 'en' but system is Portuguese, ask if user wants to change
    if (configLanguage === 'en' && this.detectSystemLanguage() === 'pt-br') {
      return false; // Don't force change, respect user's choice
    }

    return false;
  }
  /**
   * Quick setup for first-time users
   */
  async quickLanguageSetup(): Promise<SupportedLanguage> {
    const detectedLanguage = this.detectSystemLanguage();

    console.log('\n🎉 Welcome to Docker Pilot! / Bem-vindo ao Docker Pilot!');
    console.log('═══════════════════════════════════════════════════════\n');

    // Show a more comprehensive language selection
    const choices = this.getLanguageChoices();

    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: 'Choose your preferred language / Escolha seu idioma preferido:',
        choices: [
          ...choices,
          new inquirer.Separator(),
          {
            name: `🔍 Auto-detect (${choices.find(c => c.value === detectedLanguage)?.name || 'English'})`,
            value: 'auto',
            short: 'Auto-detect'
          }
        ],
        default: 'auto'
      }
    ]);

    const finalLanguage = response.language === 'auto' ? detectedLanguage : response.language;

    // Show immediate confirmation
    const selectedChoice = choices.find(c => c.value === finalLanguage);
    console.log(`\n✅ Language selected: ${selectedChoice?.name || 'English'}`);
    console.log(`✅ Idioma selecionado: ${selectedChoice?.name || 'English'}\n`);

    return finalLanguage;
  }
}
