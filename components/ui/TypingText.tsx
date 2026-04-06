import React from 'react';
import { TypingEffect, TypingEffectProps } from './TypingEffect';

/**
 * @deprecated Use TypingEffect instead for more features like rotating multiple texts and better cursor control.
 * This remains as a wrapper to maintain backward compatibility with existing single-text usage.
 */
export const TypingText: React.FC<TypingEffectProps> = (props) => {
    return <TypingEffect {...props} showCursor={false} />;
};

export default TypingText;
