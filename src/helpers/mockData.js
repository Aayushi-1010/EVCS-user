import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';
export const sliderData = [
    {
      imageSource: <MaterialCommunityIcons name="car-electric" size={300} color={colors.primary} />,
      header: "Nature Imitates Art",
      paragraph: "All in one place all in one place all in one place all in one place all in one place All in one"
    },
    {
      imageSource: <FontAwesome6 name="charging-station" size={250} color={colors.primary} />,
      header: "High Quality Art work",
      paragraph: "All in one place all in one place all in one place all in one place all in one place All in one"
    },
    {
      imageSource: <MaterialIcons name="electrical-services" size={300} color={colors.primary} />,
      header: "Top Notch Artists",
      paragraph: "All in one place all in one place all in one place all in one place all in one place All in one"
    }
  ];