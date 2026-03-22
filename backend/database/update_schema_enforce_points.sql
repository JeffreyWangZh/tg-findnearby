-- =============================================
-- NearbyPulse Pro - Enforce Positive Balance Trigger
-- 执行此脚本后，数据库将在底层死锁拦截所有可能导致积分为负数的扣除操作
-- =============================================

CREATE OR REPLACE FUNCTION check_points_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- 获取当前用户的最新真实积分余额
    SELECT COALESCE(SUM(points), 0) INTO current_balance
    FROM points_history
    WHERE tg_user_id = NEW.tg_user_id;

    -- 判断：如果本次是一个花费行为 (NEW.points < 0)，并且扣除后总额为负数
    IF NEW.points < 0 AND (current_balance + NEW.points) < 0 THEN
        RAISE EXCEPTION 'Insufficient points! Operation would result in negative balance.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 移除旧触发器防止冲突
DROP TRIGGER IF EXISTS ensure_positive_balance ON points_history;

-- 绑定拦截触发器
CREATE TRIGGER ensure_positive_balance
BEFORE INSERT ON points_history
FOR EACH ROW
EXECUTE FUNCTION check_points_balance();
