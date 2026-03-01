import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

interface Props {
    imageUri: string | null;
    onImageSelected: (uri: string | null) => void;
    label?: string;
    size?: number;
}

export default function ImagePickerButton({ imageUri, onImageSelected, label, size = 120 }: Props) {
    const theme = useTheme();
    const { t } = useTranslation();

    const displayLabel = label ?? t('common.addPhoto');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            onImageSelected(result.assets[0].uri);
        }
    };

    if (imageUri) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <Pressable onPress={pickImage}>
                    <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: 12 }} />
                </Pressable>
                <IconButton
                    icon="close-circle"
                    size={22}
                    style={styles.removeBtn}
                    iconColor={theme.colors.error}
                    onPress={() => onImageSelected(null)}
                />
            </View>
        );
    }

    return (
        <Pressable
            onPress={pickImage}
            style={[styles.placeholder, { width: size, height: size, borderColor: theme.colors.outlineVariant }]}
        >
            <IconButton icon="camera-plus" size={size > 100 ? 28 : 22} iconColor={theme.colors.outline} />
            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: -8 }}>{displayLabel}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
    removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12 },
    placeholder: {
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
