import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
// import logo from '../assets/images/logo.png';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 24
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottom: '2 solid #e5e7eb',
        paddingBottom: 12,
        marginBottom: 16
    },
    logo: {
        width: 48,
        height: 48,
        marginRight: 16
    },
    headerText: {
        flexDirection: 'column',
        flexGrow: 1
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#22223b',
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 2
    },
    sectionBox: {
        border: '1 solid #e5e7eb',
        borderRadius: 6,
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#fafafa',
    },
    sectionTitleBar: {
        backgroundColor: '#f3f4f6',
        borderLeft: '4 solid #33e407',
        padding: 6,
        marginBottom: 8,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#22223b',
        fontSize: 12
    },
    label: {
        fontSize: 10,
        color: '#374151',
        marginBottom: 2
    },
    value: {
        fontSize: 11,
        color: '#22223b',
        marginBottom: 6,
        padding: 4,
        backgroundColor: '#fff',
        border: '1 solid #e5e7eb',
        borderRadius: 4
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8
    },
    col: {
        flex: 1
    },
    textarea: {
        fontSize: 11,
        color: '#22223b',
        backgroundColor: '#fff',
        border: '1 solid #e5e7eb',
        borderRadius: 4,
        padding: 4,
        minHeight: 32,
        marginBottom: 6
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    checkbox: {
        width: 12,
        height: 12,
        border: '1 solid #33e407',
        marginRight: 6
    },
    termsText: {
        fontSize: 10,
        color: '#6b7280',
    },
    submitBtn: {
        marginTop: 12,
        alignSelf: 'flex-end',
        backgroundColor: '#33e407',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        padding: 8,
        borderRadius: 4
    },
    devicePhotoBox: {
        border: '2 dashed #d1d5db',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    devicePhoto: {
        width: 64,
        height: 64,
        marginBottom: 8
    },
    devicePhotoLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 2
    },
    ticketRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    ticketLabel: {
        fontSize: 10,
        color: '#374151',
        fontWeight: 'bold',
        marginRight: 4
    },
    ticketValue: {
        fontSize: 12,
        color: '#22223b',
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        padding: 4,
        minWidth: 60,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    termsTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexGrow: 1,   // This makes the terms text take all available space pushing the image right
    },
});

// Create Document Component
const PdfDocument = ({signatureDataURL}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>TECH REPAIR SERVICE</Text>
                    <Text style={styles.subtitle}>Repair Check-In Form</Text>
                </View>
            </View>
            {/* Ticket Row */}
            <View style={styles.ticketRow}>
                <Text style={styles.label}>Customer Check-In</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.ticketLabel}>Ticket #:</Text>
                    <Text style={styles.ticketValue}>TKT-1234</Text>
                </View>
            </View>
            {/* Customer Information */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>CUSTOMER INFORMATION</Text>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Full Name:</Text>
                        <Text style={styles.value}>John Doe</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>john@example.com</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Phone:</Text>
                        <Text style={styles.value}>+1 234 567 8900</Text>
                    </View>
                </View>
            </View>
            {/* Device Information */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>DEVICE INFORMATION</Text>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Device Type:</Text>
                        <Text style={styles.value}>Laptop</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Brand:</Text>
                        <Text style={styles.value}>Apple</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Model:</Text>
                        <Text style={styles.value}>MacBook Pro 16"</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Serial Number:</Text>
                        <Text style={styles.value}>SN123456789</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Color:</Text>
                        <Text style={styles.value}>Silver</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Password:</Text>
                        <Text style={styles.value}>••••••••</Text>
                    </View>
                </View>
            </View>
            {/* Problem Description */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>PROBLEM DESCRIPTION</Text>
                </View>
                <Text style={styles.label}>Customer Reported Issues:</Text>
                <Text style={styles.textarea}>Screen flickers and battery drains quickly.</Text>
                <Text style={styles.label}>Technician Observations:</Text>
                <Text style={styles.textarea}>To be filled by technician.</Text>
            </View>

            {/* Device Condition */}
            <View style={styles.sectionBox}>
                <View style={styles.sectionTitleBar}>
                    <Text style={styles.sectionTitle}>DEVICE CONDITION</Text>
                </View>
                <View style={styles.devicePhotoBox}>
                    <Text style={styles.devicePhotoLabel}>Photo of device condition</Text>
                </View>
            </View>
            {/* Terms and Conditions */}
            <View style={styles.sectionBox}>
                <View style={styles.checkboxRow}>
                    <View style={styles.termsTextContainer}>
                        <View style={styles.checkbox} />
                        <Text style={styles.termsText}>I have read and agree to the repair terms and conditions</Text>
                    </View>

                    {typeof signatureDataURL === 'string' && signatureDataURL.startsWith('data:image') ? (
                        <Image
                            src={signatureDataURL}
                            style={{ width: 150, height: 50, objectFit: 'contain' }}
                        />
                    ) : (
                        <Text style={styles.label}>No signature captured.</Text>
                    )}
                </View>
            </View>

        </Page>
    </Document>
);

export default PdfDocument;

