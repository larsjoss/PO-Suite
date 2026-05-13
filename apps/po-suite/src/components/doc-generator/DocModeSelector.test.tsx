import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocModeSelector } from './DocModeSelector';

function setup(value: 'story' | 'feature' = 'story', onChange = vi.fn(), disabled = false) {
  render(<DocModeSelector value={value} onChange={onChange} disabled={disabled} />);
  return { onChange };
}

describe('DocModeSelector', () => {
  describe('Rendering', () => {
    it('rendert beide Tabs', () => {
      setup();
      expect(screen.getByRole('tab', { name: 'Story Mode' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Feature Mode' })).toBeInTheDocument();
    });

    it('hat role=tablist mit aria-label', () => {
      setup();
      expect(screen.getByRole('tablist')).toHaveAttribute(
        'aria-label',
        'Dokumentations-Modus auswählen',
      );
    });

    it('markiert aktiven Tab als aria-selected=true', () => {
      setup('story');
      expect(screen.getByRole('tab', { name: 'Story Mode' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('tab', { name: 'Feature Mode' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('markiert aktiven Tab in Feature Mode', () => {
      setup('feature');
      expect(screen.getByRole('tab', { name: 'Feature Mode' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('tab', { name: 'Story Mode' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('setzt tabIndex=0 auf aktiven und -1 auf inaktiven Tab', () => {
      setup('story');
      expect(screen.getByRole('tab', { name: 'Story Mode' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('tab', { name: 'Feature Mode' })).toHaveAttribute('tabindex', '-1');
    });

    it('disabled deaktiviert beide Buttons', () => {
      setup('story', vi.fn(), true);
      expect(screen.getByRole('tab', { name: 'Story Mode' })).toBeDisabled();
      expect(screen.getByRole('tab', { name: 'Feature Mode' })).toBeDisabled();
    });
  });

  describe('Klick-Interaktion', () => {
    it('ruft onChange beim Klick auf inaktiven Tab auf', async () => {
      const { onChange } = setup('story');
      await userEvent.click(screen.getByRole('tab', { name: 'Feature Mode' }));
      expect(onChange).toHaveBeenCalledWith('feature');
    });

    it('ruft onChange beim Klick auf aktiven Tab ebenfalls auf', async () => {
      const { onChange } = setup('story');
      await userEvent.click(screen.getByRole('tab', { name: 'Story Mode' }));
      expect(onChange).toHaveBeenCalledWith('story');
    });
  });

  describe('Keyboard-Navigation', () => {
    it('navigiert mit ArrowRight vom ersten zum zweiten Tab', async () => {
      const { onChange } = setup('story');
      await userEvent.type(screen.getByRole('tab', { name: 'Story Mode' }), '{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('feature');
    });

    it('navigiert mit ArrowLeft vom zweiten zum ersten Tab', async () => {
      const { onChange } = setup('feature');
      await userEvent.type(screen.getByRole('tab', { name: 'Feature Mode' }), '{ArrowLeft}');
      expect(onChange).toHaveBeenCalledWith('story');
    });

    it('springt mit ArrowRight vom letzten zum ersten Tab (Wrap)', async () => {
      const { onChange } = setup('feature');
      await userEvent.type(screen.getByRole('tab', { name: 'Feature Mode' }), '{ArrowRight}');
      expect(onChange).toHaveBeenCalledWith('story');
    });

    it('springt mit ArrowLeft vom ersten zum letzten Tab (Wrap)', async () => {
      const { onChange } = setup('story');
      await userEvent.type(screen.getByRole('tab', { name: 'Story Mode' }), '{ArrowLeft}');
      expect(onChange).toHaveBeenCalledWith('feature');
    });

    it('navigiert mit Home immer zum ersten Tab', async () => {
      const { onChange } = setup('feature');
      await userEvent.type(screen.getByRole('tab', { name: 'Feature Mode' }), '{Home}');
      expect(onChange).toHaveBeenCalledWith('story');
    });

    it('navigiert mit End immer zum letzten Tab', async () => {
      const { onChange } = setup('story');
      await userEvent.type(screen.getByRole('tab', { name: 'Story Mode' }), '{End}');
      expect(onChange).toHaveBeenCalledWith('feature');
    });
  });
});
