/**
 * Vouchers Controller
 */

import { ref, get, set, update, push } from 'firebase/database';
import { database } from '../config/firebase.config';

export const createVoucher = async (voucherData) => {
  try {
    const newRef = push(ref(database, 'vouchers'));
    await set(newRef, {
      ...voucherData,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { success: true, id: newRef.key };
  } catch (error) {
    console.error('Error creating voucher:', error);
    return { success: false, error: error.message };
  }
};

export const getVoucher = async (serial, pin) => {
  try {
    const snapshot = await get(ref(database, 'vouchers'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Convert object to array
      const array = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      const voucher = array.find(
        v => v.code === serial && v.pin === pin && v.status === 'unused'
      );

      if (voucher) {
        // Check if voucher is expired
        const isExpired = new Date(voucher.expiresAt) < new Date();
        if (isExpired) {
          return { success: false, error: 'Voucher has expired' };
        }
        return { success: true, data: voucher };
      }
      return { success: false, error: 'Invalid voucher code or PIN' };
    }
    return { success: false, error: 'No vouchers found' };
  } catch (error) {
    console.error('Error getting voucher:', error);
    return { success: false, error: error.message };
  }
};

export const markVoucherAsUsed = async (voucherId, studentId) => {
  try {
    await update(ref(database, `vouchers/${voucherId}`), {
      status: 'used',
      usedBy: studentId,
      usedAt: Date.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking voucher as used:', error);
    return { success: false, error: error.message };
  }
};