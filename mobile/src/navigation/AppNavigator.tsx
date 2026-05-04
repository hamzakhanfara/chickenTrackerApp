import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { FarmFormScreen } from "../screens/FarmFormScreen";
import { CoopsListScreen } from "../screens/CoopsListScreen";
import { CoopLotsListScreen } from "../screens/CoopLotsListScreen";
import { CreateCoopScreen } from "../screens/CreateCoopScreen";
import { CreateDailyEntryScreen } from "../screens/CreateDailyEntryScreen";
import { LotDetailScreen } from "../screens/LotDetailScreen";
import { SelectLotForDailyEntryScreen } from "../screens/SelectLotForDailyEntryScreen";
import { CreateLotScreen } from "../screens/CreateLotScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { AddTaskScreen } from "../screens/AddTaskScreen";
import { ReportsScreen } from "../screens/ReportsScreen";

export type AppStackParamList = {
  Home: undefined;
  FarmForm: undefined;
  CoopsList: { farmId: string; farmName?: string };
  CoopLotsList: {
    farmId: string;
    farmName?: string;
    coopId: string;
    coopName?: string;
  };
  CreateCoop: { farmId: string; farmName?: string };
  CreateLot: { coopId: string; coopName?: string };
  LotDetail: {
    lotId: string;
    coopId: string;
    farmId: string;
    lotCode?: string;
  };
  SelectLotForDailyEntry: { farmId: string; farmName?: string };
  CreateDailyEntry: { lotId: string; lotCode?: string };
  Calendar: { farmId: string; farmName?: string };
  AddTask: { farmId: string; lotId?: string; lotCode?: string };
  Reports: { farmId?: string; lotId?: string; lotCode?: string } | undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen
      name="FarmForm"
      component={FarmFormScreen}
      options={{
        headerShown: true,
        title: "Créer une ferme",
        headerTintColor: "#1B5E20",
        headerStyle: { backgroundColor: "#f7fbf1" },
      }}
    />
    <Stack.Screen name="CoopsList" component={CoopsListScreen} />
    <Stack.Screen name="CoopLotsList" component={CoopLotsListScreen} />
    <Stack.Screen name="CreateCoop" component={CreateCoopScreen} />
    <Stack.Screen name="CreateLot" component={CreateLotScreen} />
    <Stack.Screen name="LotDetail" component={LotDetailScreen} />
    <Stack.Screen
      name="SelectLotForDailyEntry"
      component={SelectLotForDailyEntryScreen}
    />
    <Stack.Screen name="CreateDailyEntry" component={CreateDailyEntryScreen} />
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="AddTask" component={AddTaskScreen} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
  </Stack.Navigator>
);
