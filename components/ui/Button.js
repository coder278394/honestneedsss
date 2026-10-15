'use client';

import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import NextLink from 'next/link';

const buttonVariants = {
  primary: css`
    background-color: #6366F1;
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

    &:hover {
      background-color: #4F46E5;
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
  `,
  secondary: css`
    background-color: transparent;
    color: #6366F1;
    border: 2px solid #6366F1;

    &:hover {
      background-color: rgba(99, 102, 241, 0.05);
      transform: translateY(-2px);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: #6366F1;
    padding: 8px 12px;

    &:hover {
      background-color: rgba(99, 102, 241, 0.08);
      text-decoration: underline;
    }
  `,
  icon: css`
    background-color: transparent;
    color: #64748B;
    padding: 8px;
    border-radius: 9999px;

    &:hover {
      background-color: #F8FAFC;
      color: #0F172A;
    }
  `,
};

const buttonSizes = {
  small: css`
    padding: ${({ theme }) => theme?.spacing?.sm || '8px'} ${({ theme }) => theme?.spacing?.lg || '16px'};
    font-size: ${({ theme }) => theme?.typography?.sizes?.small?.size || '14px'};
  `,
  medium: css`
    padding: ${({ theme }) => theme?.spacing?.md || '12px'} ${({ theme }) => theme?.spacing?.xl || '24px'};
    font-size: ${({ theme }) => theme?.typography?.sizes?.body?.size || '16px'};
  `,
  large: css`
    padding: ${({ theme }) => theme?.spacing?.lg || '16px'} ${({ theme }) => theme?.spacing?.['2xl'] || '32px'};
    font-size: ${({ theme }) => theme?.typography?.sizes?.h4?.size || '18px'};
  `,
};

const StyledButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme?.spacing?.sm || '8px'};
  border-radius: ${({ theme }) => theme?.radii?.medium || '12px'};
  font-weight: ${({ theme }) => theme?.typography?.weights?.semibold || '600'};
  transition: all ${({ theme }) => theme?.transitions?.fast || '100ms ease'};
  cursor: pointer;
  border: none;
  outline: none;

  ${({ $variant }) => buttonVariants[$variant] || buttonVariants.primary}
  ${({ $size }) => buttonSizes[$size] || buttonSizes.medium}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  svg {
    width: 1.2em;
    height: 1.2em;
  }
`;

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  as,
  ...props
}) {
  // `as="link"` is a common caller shortcut meaning "render as a Next.js
  // link, not the HTML <link> void tag". Catch the lowercase/string form
  // here so we don't accidentally emit a `<link>…</link>` and crash React.
  let polymorphicAs = as;
  if (typeof as === 'string' && as.toLowerCase() === 'link') {
    polymorphicAs = NextLink;
  }

  return (
    <StyledButton
      $variant={variant}
      $size={size}
      whileTap={{ scale: 0.98 }}
      {...(polymorphicAs ? { as: polymorphicAs } : {})}
      {...props}
    >
      {Icon && <Icon />}
      {children}
    </StyledButton>
  );
}
