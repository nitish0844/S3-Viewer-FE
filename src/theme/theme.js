import { Select, createTheme } from '@mantine/core'
import { generateColors } from '@mantine/colors-generator';
import { COLORS } from '../constants/colors';

export const theme = createTheme({
  fontFamily: 'Duplet, system-ui, Avenir, Helvetica, Arial, sans-serif',
  primaryColor: 'primary',
  primaryShade: 9,
  colors: {
    primary: generateColors(COLORS.primary),
    secondary: generateColors(COLORS.secondary),
  },
  components: {
    Select: Select.extend({
      styles: ({
        dropdown: {
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px'
        }
      })
    }),
  }
});